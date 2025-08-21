from django.test import TestCase, Client
from django.contrib.auth.models import User
from accounts.models import UserProfile, LoanProduct, LoanApplication, Loan, Payment

class TestEndToEnd(TestCase):
    def setUp(self):
        self.client = Client()

    def test_registration_and_login(self):
        # Registration
        user = User.objects.create_user(username='testuser', password='testpass', email='test@example.com')
        profile = UserProfile.objects.create(user=user, full_name='Test User', phone_number='08012345678')
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        # Login
        login = self.client.login(username='testuser', password='testpass')
        self.assertTrue(login)

    def test_loan_application_flow(self):
        # Setup user and product
        user = User.objects.create_user(username='testuser2', password='testpass2', email='test2@example.com')
        profile = UserProfile.objects.create(user=user, full_name='Test User2', phone_number='08087654321')
        product = LoanProduct.objects.create(name='Education Loan', loan_type='education', min_amount=10000, max_amount=50000, interest_rate=15, max_tenure_months=1)
        # Apply for loan
        app = LoanApplication.objects.create(applicant=profile, loan_product=product, requested_amount=20000, tenure_months=1, interest_rate=15, processing_fee=500)
        self.assertEqual(app.status, 'pending')
        # Approve and disburse
        app.status = 'approved'
        app.save()
        app.status = 'disbursed'
        app.save()
        self.assertEqual(app.status, 'disbursed')
        # Create loan
        loan = Loan.objects.create(application=app, principal_amount=20000, interest_amount=3000, total_amount=23000, monthly_payment=23000, status='active', disbursement_date='2025-08-17', maturity_date='2025-09-17', outstanding_balance=23000)
        self.assertEqual(loan.status, 'active')

    def test_repayment_and_closure(self):
        # Setup user, product, loan
        user = User.objects.create_user(username='testuser3', password='testpass3', email='test3@example.com')
        profile = UserProfile.objects.create(user=user, full_name='Test User3', phone_number='08011223344')
        product = LoanProduct.objects.create(name='Personal Loan', loan_type='personal', min_amount=5000, max_amount=30000, interest_rate=15, max_tenure_months=1)
        app = LoanApplication.objects.create(applicant=profile, loan_product=product, requested_amount=10000, tenure_months=1, interest_rate=15, processing_fee=250, status='disbursed')
        loan = Loan.objects.create(application=app, principal_amount=10000, interest_amount=1500, total_amount=11500, monthly_payment=11500, status='active', disbursement_date='2025-08-17', maturity_date='2025-09-17', outstanding_balance=11500)
        # Make repayment
        payment = Payment.objects.create(loan=loan, amount=11500, payment_method='bank_transfer', status='successful', payment_date='2025-08-18', due_date='2025-09-17')
        loan = Loan.objects.get(pk=loan.pk)
        # Loan should be closed
        self.assertEqual(loan.status, 'closed')
        self.assertEqual(loan.outstanding_balance, 0)
