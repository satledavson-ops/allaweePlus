from rest_framework import serializers
from .models import LoanApplication

class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = '__all__'
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, LoanProduct, LoanApplication, 
    Loan, Payment, RepaymentSchedule, RemitaTransaction
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'remita_mandate_id', 'remita_payer_id']

class UserProfileCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'password', 'full_name', 'nysc_state_code', 
                 'nysc_certificate', 'bank_details', 'bvn', 'phone_number', 
                 'date_of_birth', 'nysc_start_date', 'nysc_end_date']
    
    def create(self, validated_data):
        # Extract user data
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=validated_data.get('full_name', '').split()[0] if validated_data.get('full_name') else ''
        )
        
        # Create profile
        profile = UserProfile.objects.create(user=user, **validated_data)
        return profile

class LoanProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanProduct
        fields = '__all__'

class LoanApplicationSerializer(serializers.ModelSerializer):
    applicant = UserProfileSerializer(read_only=True)
    loan_product = LoanProductSerializer(read_only=True)
    loan_product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['application_id', 'application_date', 'review_date', 
                           'approval_date', 'disbursement_date', 'reviewed_by']

class LoanApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = ['loan_product', 'requested_amount', 'tenure_months', 'purpose']
    
    def create(self, validated_data):
        # Calculate processing fee and interest rate
        loan_product = validated_data['loan_product']
        requested_amount = validated_data['requested_amount']
        
        processing_fee = requested_amount * (loan_product.processing_fee_percentage / 100)
        
        validated_data['interest_rate'] = loan_product.interest_rate
        validated_data['processing_fee'] = processing_fee
        validated_data['applicant'] = self.context['request'].user.profile
        
        return super().create(validated_data)

class LoanSerializer(serializers.ModelSerializer):
    application = LoanApplicationSerializer(read_only=True)
    borrower_name = serializers.CharField(source='application.applicant.full_name', read_only=True)
    
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ['loan_id', 'created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    loan = LoanSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['payment_id', 'created_at']

class RepaymentScheduleSerializer(serializers.ModelSerializer):
    loan = LoanSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    
    class Meta:
        model = RepaymentSchedule
        fields = '__all__'

class RemitaTransactionSerializer(serializers.ModelSerializer):
    user_profile = UserProfileSerializer(read_only=True)
    loan = LoanSerializer(read_only=True)
    
    class Meta:
        model = RemitaTransaction
        fields = '__all__'
        read_only_fields = ['initiated_at', 'completed_at']

# Dashboard Serializers for Admin Panel
class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    total_active_loans = serializers.IntegerField()
    total_loan_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_collections = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_applications = serializers.IntegerField()
    overdue_payments = serializers.IntegerField()
    default_rate = serializers.DecimalField(max_digits=5, decimal_places=2)

class MonthlyStatsSerializer(serializers.Serializer):
    month = serializers.CharField()
    applications = serializers.IntegerField()
    disbursements = serializers.DecimalField(max_digits=15, decimal_places=2)
    collections = serializers.DecimalField(max_digits=15, decimal_places=2)

# Authentication Serializers
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user