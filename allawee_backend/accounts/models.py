from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

def user_certificate_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/certificates/user_<id>/<filename>
    return f'certificates/user_{instance.user.id}/{filename}'

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, default='')
    nysc_state_code = models.CharField(max_length=10, default='')
    nysc_certificate = models.FileField(upload_to=user_certificate_path, null=True, blank=True)
    bank_details = models.CharField(max_length=255, default='')
    bvn = models.CharField(max_length=11, default='')
    phone_number = models.CharField(max_length=15, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    nysc_start_date = models.DateField(null=True, blank=True)
    nysc_end_date = models.DateField(null=True, blank=True)
    monthly_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('33000.00'))
    
    # Remita Integration Fields
    remita_mandate_id = models.CharField(max_length=100, blank=True, null=True)
    remita_payer_id = models.CharField(max_length=100, blank=True, null=True)
    salary_account_verified = models.BooleanField(default=False)
    last_salary_verification = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

class LoanProduct(models.Model):
    LOAN_TYPES = [
        ('emergency', 'Emergency Loan'),
        ('education', 'Education Loan'),
        ('business', 'Business Loan'),
        ('personal', 'Personal Loan'),
    ]
    
    name = models.CharField(max_length=100)
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    min_amount = models.DecimalField(max_digits=10, decimal_places=2)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    max_tenure_months = models.IntegerField()
    processing_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('2.5'))
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.loan_type})"

class LoanApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
        ('cancelled', 'Cancelled'),
    ]
    
    applicant = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='loan_applications')
    loan_product = models.ForeignKey(LoanProduct, on_delete=models.CASCADE)
    application_id = models.CharField(max_length=20, unique=True)
    
    # Loan Details
    requested_amount = models.DecimalField(max_digits=10, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    tenure_months = models.IntegerField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Application Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    purpose = models.TextField()
    
    # Dates
    application_date = models.DateTimeField(auto_now_add=True)
    review_date = models.DateTimeField(blank=True, null=True)
    approval_date = models.DateTimeField(blank=True, null=True)
    disbursement_date = models.DateTimeField(blank=True, null=True)
    
    # Review Information
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_applications')
    review_comments = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        if not self.application_id:
            # Generate unique application ID
            import uuid
            self.application_id = f"AL{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.application_id} - {self.applicant.full_name}"

class Loan(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('defaulted', 'Defaulted'),
        ('written_off', 'Written Off'),
    ]
    
    application = models.OneToOneField(LoanApplication, on_delete=models.CASCADE, related_name='loan')
    loan_id = models.CharField(max_length=20, unique=True)
    
    # Loan Details
    principal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_payment = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Loan Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    disbursement_date = models.DateTimeField()
    maturity_date = models.DateField()
    
    # Payment Tracking
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    outstanding_balance = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Remita Integration
    remita_mandate_id = models.CharField(max_length=100, blank=True, null=True)
    auto_deduction_active = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.loan_id:
            import uuid
            self.loan_id = f"LN{str(uuid.uuid4())[:8].upper()}"
        if self.pk:
            total_paid = self.payments.aggregate(total=models.Sum('amount'))['total'] or 0
            self.outstanding_balance = self.total_amount - total_paid
        else:
            self.outstanding_balance = self.total_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.loan_id} - {self.application.applicant.full_name}"

    def check_and_close(self):
        total_paid = self.payments.aggregate(total=models.Sum('amount'))['total'] or 0
        self.outstanding_balance = self.total_amount - total_paid
        if total_paid >= self.total_amount and self.status != 'closed':
            self.status = 'closed'
            self.outstanding_balance = 0
        self.save()
        # Optionally, notify user/admin here
        # NOTE: Call this method after each repayment
class Payment(models.Model):
    PAYMENT_METHODS = [
        ('remita_auto', 'Remita Auto Deduction'),
        ('remita_manual', 'Remita Manual Payment'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash Payment'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    payment_id = models.CharField(max_length=20, unique=True)
    
    # Payment Details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment Dates
    payment_date = models.DateTimeField()
    due_date = models.DateField()
    
    # Remita Fields
    remita_rrr = models.CharField(max_length=100, blank=True, null=True)
    remita_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    remita_response = models.JSONField(blank=True, null=True)
    
    # Additional Info
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.payment_id:
            import uuid
            self.payment_id = f"PY{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
        if self.loan:
            self.loan.check_and_close()
    
    def __str__(self):
        return f"{self.payment_id} - ₦{self.amount}"

class RepaymentSchedule(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayment_schedule')
    installment_number = models.IntegerField()
    due_date = models.DateField()
    principal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment Status
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateTimeField(blank=True, null=True)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, blank=True, null=True)
    
    # Late Payment Tracking
    is_overdue = models.BooleanField(default=False)
    days_overdue = models.IntegerField(default=0)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    def __str__(self):
        return f"{self.loan.loan_id} - Installment {self.installment_number}"

class RemitaTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('salary_verification', 'Salary Verification'),
        ('mandate_setup', 'Mandate Setup'),
        ('payment_collection', 'Payment Collection'),
        ('mandate_cancellation', 'Mandate Cancellation'),
    ]
    
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='remita_transactions')
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, blank=True, null=True, related_name='remita_transactions')
    
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES)
    remita_rrr = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Remita Response Data
    status = models.CharField(max_length=50)
    response_data = models.JSONField()
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.remita_rrr}"
