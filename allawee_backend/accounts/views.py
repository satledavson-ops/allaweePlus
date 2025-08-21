from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import (
    UserProfile, LoanProduct, LoanApplication, 
    Loan, Payment, RepaymentSchedule, RemitaTransaction
)
from .serializers import (
    UserProfileSerializer, UserProfileCreateSerializer,
    LoanProductSerializer, LoanApplicationSerializer, LoanApplicationCreateSerializer,
    LoanSerializer, PaymentSerializer, RepaymentScheduleSerializer,
    RemitaTransactionSerializer, DashboardStatsSerializer, MonthlyStatsSerializer,
    LoginSerializer, ChangePasswordSerializer
)

# Authentication Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    print(f"Login attempt - Request data: {request.data}")
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username_or_email_or_phone = serializer.validated_data['username']
        password = serializer.validated_data['password']
        print(f"Login attempt - Username/Email/Phone: {username_or_email_or_phone}, Password: {password[:3]}...")
        
        # Try authentication with username first
        user = authenticate(username=username_or_email_or_phone, password=password)
        
        # If failed, try to find user by email and authenticate
        if not user:
            try:
                user_by_email = User.objects.get(email=username_or_email_or_phone)
                user = authenticate(username=user_by_email.username, password=password)
                print(f"Authentication by email result: {user}")
            except User.DoesNotExist:
                pass
        
        # If still failed, try to find user by phone and authenticate
        if not user:
            try:
                from .models import UserProfile
                profile = UserProfile.objects.get(phone_number=username_or_email_or_phone)
                user = authenticate(username=profile.user.username, password=password)
                print(f"Authentication by phone result: {user}")
            except UserProfile.DoesNotExist:
                pass
        
        print(f"Final authentication result: {user}")
        if user:
            token, created = Token.objects.get_or_create(user=user)
            
            # Safely get profile data
            profile_data = None
            try:
                if hasattr(user, 'profile'):
                    profile_data = UserProfileSerializer(user.profile).data
            except:
                profile_data = None
            
            return Response({
                'token': token.key,
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'profile': profile_data
            })
        else:
            print(f"Authentication failed for username: {username_or_email_or_phone}")
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    print(f"Serializer validation failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = UserProfileCreateSerializer(data=request.data)
    if serializer.is_valid():
        profile = serializer.save()
        token, created = Token.objects.get_or_create(user=profile.user)
        
        return Response({
            'token': token.key,
            'user_id': profile.user.id,
            'profile': UserProfileSerializer(profile).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out'})
    except:
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)

# User Profile Views
class UserProfileDetail(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.profile

# Loan Product Views
class LoanProductList(generics.ListAPIView):
    queryset = LoanProduct.objects.filter(is_active=True)
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to view loan products

class LoanProductDetail(generics.RetrieveAPIView):
    queryset = LoanProduct.objects.filter(is_active=True)
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.AllowAny]  # Allow anyone to view loan product details

# Loan Application Views
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class LoanApplicationList(generics.ListCreateAPIView):
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return LoanApplication.objects.all().order_by('-application_date')
        return LoanApplication.objects.filter(applicant=self.request.user.profile).order_by('-application_date')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LoanApplicationCreateSerializer
        return LoanApplicationSerializer
    
class LoanApplicationListCreateView(generics.ListCreateAPIView):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer

    def perform_create(self, serializer):
        loan_application = serializer.save()
        # Dummy Remita NYSC verification
        is_nysc_member = self.dummy_remita_nysc_verification(loan_application)
        if is_nysc_member:
            # Automatically approve and disburse
            loan_application.status = 'approved'
            loan_application.save()
            self.dummy_remita_disbursement(loan_application)
        # NOTE: Replace dummy_remita_nysc_verification and dummy_remita_disbursement with real Remita API calls

    def dummy_remita_nysc_verification(self, loan_application):
        # Dummy logic: approve if applicant profile has 'nysc_member' True
        profile = getattr(loan_application.applicant, 'profile', None)
        return getattr(profile, 'nysc_member', False)

    def dummy_remita_disbursement(self, loan_application):
        # Dummy logic: mark as disbursed
        loan_application.disbursed = True
        loan_application.save()
        # NOTE: Here, call Remita's payment/disbursement API

class LoanApplicationDetail(generics.RetrieveUpdateAPIView):
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return LoanApplication.objects.all()
        return LoanApplication.objects.filter(applicant=self.request.user.profile)

# Loan Views
class LoanList(generics.ListAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Loan.objects.all().order_by('-created_at')
        return Loan.objects.filter(application__applicant=self.request.user.profile).order_by('-created_at')

class LoanDetail(generics.RetrieveAPIView):
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Loan.objects.all()
        return Loan.objects.filter(application__applicant=self.request.user.profile)

# Payment Views
class PaymentList(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.all().order_by('-created_at')
        return Payment.objects.filter(loan__application__applicant=self.request.user.profile).order_by('-created_at')

class RepaymentScheduleList(generics.ListAPIView):
    serializer_class = RepaymentScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        loan_id = self.kwargs.get('loan_id')
        queryset = RepaymentSchedule.objects.filter(loan_id=loan_id).order_by('installment_number')
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(loan__application__applicant=self.request.user.profile)
        
        return queryset

# Dashboard Views for Admin
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_stats(request):
    # Calculate dashboard statistics
    total_users = UserProfile.objects.count()
    total_applications = LoanApplication.objects.count()
    total_active_loans = Loan.objects.filter(status='active').count()
    total_loan_amount = Loan.objects.aggregate(total=Sum('principal_amount'))['total'] or Decimal('0')
    total_collections = Payment.objects.filter(status='successful').aggregate(total=Sum('amount'))['total'] or Decimal('0')
    pending_applications = LoanApplication.objects.filter(status='pending').count()
    overdue_payments = RepaymentSchedule.objects.filter(is_overdue=True, is_paid=False).count()
    
    # Calculate default rate
    total_loans = Loan.objects.count()
    defaulted_loans = Loan.objects.filter(status='defaulted').count()
    default_rate = (defaulted_loans / total_loans * 100) if total_loans > 0 else 0
    
    stats = {
        'total_users': total_users,
        'total_applications': total_applications,
        'total_active_loans': total_active_loans,
        'total_loan_amount': total_loan_amount,
        'total_collections': total_collections,
        'pending_applications': pending_applications,
        'overdue_payments': overdue_payments,
        'default_rate': round(default_rate, 2)
    }
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def monthly_trends(request):
    # Get last 12 months data
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=365)
    
    monthly_data = []
    current_date = start_date.replace(day=1)
    
    while current_date <= end_date:
        next_month = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)
        
        applications = LoanApplication.objects.filter(
            application_date__date__gte=current_date,
            application_date__date__lt=next_month
        ).count()
        
        disbursements = Loan.objects.filter(
            disbursement_date__date__gte=current_date,
            disbursement_date__date__lt=next_month
        ).aggregate(total=Sum('principal_amount'))['total'] or Decimal('0')
        
        collections = Payment.objects.filter(
            payment_date__date__gte=current_date,
            payment_date__date__lt=next_month,
            status='successful'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        monthly_data.append({
            'month': current_date.strftime('%Y-%m'),
            'applications': applications,
            'disbursements': disbursements,
            'collections': collections
        })
        
        current_date = next_month
    
    serializer = MonthlyStatsSerializer(monthly_data, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request):
    """Dashboard data for regular users"""
    user_profile = request.user.profile
    
    # User's loan statistics
    applications = LoanApplication.objects.filter(applicant=user_profile)
    loans = Loan.objects.filter(application__applicant=user_profile)
    payments = Payment.objects.filter(loan__application__applicant=user_profile, status='successful')
    
    stats = {
        'total_applications': applications.count(),
        'pending_applications': applications.filter(status='pending').count(),
        'approved_applications': applications.filter(status='approved').count(),
        'active_loans': loans.filter(status='active').count(),
        'total_borrowed': loans.aggregate(total=Sum('principal_amount'))['total'] or Decimal('0'),
        'total_paid': payments.aggregate(total=Sum('amount'))['total'] or Decimal('0'),
        'outstanding_balance': loans.filter(status='active').aggregate(total=Sum('outstanding_balance'))['total'] or Decimal('0'),
        'next_payment_due': RepaymentSchedule.objects.filter(
            loan__application__applicant=user_profile,
            is_paid=False
        ).order_by('due_date').first()
    }
    
    return Response(stats)

# Remita Integration Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_salary(request):
    """Verify user's salary through Remita"""
    user_profile = request.user.profile
    
    # Mock salary verification
    verification_data = {
        'status': 'success',
        'salary_verified': True,
        'monthly_salary': user_profile.monthly_allowance,
        'employer': 'NYSC',
        'verification_date': timezone.now()
    }
    
    # Update user profile
    user_profile.salary_account_verified = True
    user_profile.last_salary_verification = timezone.now()
    user_profile.save()
    
    return Response(verification_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def setup_mandate(request):
    """Setup Remita mandate for automatic deductions"""
    loan_id = request.data.get('loan_id')
    
    try:
        loan = Loan.objects.get(id=loan_id, application__applicant=request.user.profile)
        
        # Mock mandate setup
        mandate_data = {
            'status': 'success',
            'mandate_id': f"MND{loan.loan_id}",
            'message': 'Mandate setup successful'
        }
        
        # Update loan
        loan.remita_mandate_id = mandate_data['mandate_id']
        loan.auto_deduction_active = True
        loan.save()
        
        return Response(mandate_data)
        
    except Loan.DoesNotExist:
        return Response({'error': 'Loan not found'}, status=status.HTTP_404_NOT_FOUND)