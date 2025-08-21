"""
Optimized views for handling 20,000 concurrent users and 500,000+ records
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.core.cache import cache
from django.db.models import Q, Count, Sum, Avg
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
import logging

from .models import UserProfile, LoanApplication, Loan, Payment, LoanProduct
from .serializers import (
    UserProfileSerializer, LoanApplicationSerializer, 
    LoanSerializer, PaymentSerializer, LoanProductSerializer
)

logger = logging.getLogger(__name__)

class CustomPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

class LoginRateThrottle(UserRateThrottle):
    scope = 'login'

class OptimizedUserProfileViewSet(viewsets.ModelViewSet):
    """
    Optimized UserProfile ViewSet with caching and efficient queries
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['nysc_state_code', 'salary_account_verified']
    search_fields = ['full_name', 'phone_number', 'bvn']
    ordering_fields = ['created_at', 'full_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized queryset with select_related for performance"""
        queryset = UserProfile.objects.select_related('user').prefetch_related(
            'loan_applications__loan_product',
            'loans__payments'
        )
        
        # Cache frequent queries
        cache_key = f"user_profiles_count_{self.request.user.id}"
        if cache.get(cache_key) is None:
            count = queryset.count()
            cache.set(cache_key, count, 300)  # Cache for 5 minutes
        
        return queryset
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    @method_decorator(vary_on_headers('User-Agent'))
    def list(self, request, *args, **kwargs):
        """Cached list view"""
        return super().list(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def loan_summary(self, request, pk=None):
        """Get user's loan summary with caching"""
        cache_key = f"user_loan_summary_{pk}"
        summary = cache.get(cache_key)
        
        if summary is None:
            user_profile = self.get_object()
            loans = user_profile.loans.all()
            
            summary = {
                'total_loans': loans.count(),
                'active_loans': loans.filter(status='active').count(),
                'total_borrowed': loans.aggregate(Sum('principal_amount'))['principal_amount__sum'] or 0,
                'total_outstanding': loans.filter(status='active').aggregate(
                    Sum('outstanding_balance'))['outstanding_balance__sum'] or 0,
                'average_loan_amount': loans.aggregate(Avg('principal_amount'))['principal_amount__avg'] or 0,
            }
            cache.set(cache_key, summary, 600)  # Cache for 10 minutes
        
        return Response(summary)

class OptimizedLoanApplicationViewSet(viewsets.ModelViewSet):
    """
    Optimized LoanApplication ViewSet for high-volume processing
    """
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'loan_product__loan_type']
    search_fields = ['loan_id', 'user__profile__full_name']
    ordering_fields = ['created_at', 'requested_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized queryset with proper joins"""
        return LoanApplication.objects.select_related(
            'user', 'user__profile', 'loan_product'
        ).prefetch_related('loans')
    
    @method_decorator(cache_page(180))  # Cache for 3 minutes
    def list(self, request, *args, **kwargs):
        """Cached list with frequent updates"""
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get application statistics with caching"""
        cache_key = "loan_application_stats"
        stats = cache.get(cache_key)
        
        if stats is None:
            queryset = self.get_queryset()
            stats = {
                'total_applications': queryset.count(),
                'pending_applications': queryset.filter(status='pending').count(),
                'approved_applications': queryset.filter(status='approved').count(),
                'rejected_applications': queryset.filter(status='rejected').count(),
                'total_requested_amount': queryset.aggregate(
                    Sum('requested_amount'))['requested_amount__sum'] or 0,
                'average_requested_amount': queryset.aggregate(
                    Avg('requested_amount'))['requested_amount__avg'] or 0,
            }
            cache.set(cache_key, stats, 300)  # Cache for 5 minutes
        
        return Response(stats)

class OptimizedLoanViewSet(viewsets.ModelViewSet):
    """
    Optimized Loan ViewSet with efficient queries and caching
    """
    serializer_class = LoanSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'loan_product__loan_type']
    search_fields = ['loan_id', 'user__profile__full_name']
    ordering_fields = ['created_at', 'principal_amount', 'disbursement_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized queryset with selective loading"""
        return Loan.objects.select_related(
            'user', 'user__profile', 'loan_product', 'loan_application'
        ).prefetch_related(
            'payments',
            'repayment_schedule'
        )
    
    @action(detail=True, methods=['get'])
    def repayment_schedule(self, request, pk=None):
        """Get loan repayment schedule with caching"""
        cache_key = f"loan_repayment_schedule_{pk}"
        schedule = cache.get(cache_key)
        
        if schedule is None:
            loan = self.get_object()
            schedule_items = loan.repayment_schedule.all().order_by('installment_number')
            
            schedule = {
                'loan_id': loan.loan_id,
                'total_installments': schedule_items.count(),
                'paid_installments': schedule_items.filter(is_paid=True).count(),
                'overdue_installments': schedule_items.filter(is_overdue=True).count(),
                'next_payment': schedule_items.filter(is_paid=False).first(),
                'schedule': [
                    {
                        'installment_number': item.installment_number,
                        'due_date': item.due_date,
                        'principal_amount': item.principal_amount,
                        'interest_amount': item.interest_amount,
                        'total_amount': item.total_amount,
                        'is_paid': item.is_paid,
                        'is_overdue': item.is_overdue,
                        'days_overdue': item.days_overdue,
                        'late_fee': item.late_fee,
                    }
                    for item in schedule_items
                ]
            }
            cache.set(cache_key, schedule, 1800)  # Cache for 30 minutes
        
        return Response(schedule)

class OptimizedPaymentViewSet(viewsets.ModelViewSet):
    """
    Optimized Payment ViewSet for transaction processing
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_method']
    search_fields = ['payment_id', 'loan__loan_id']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Optimized payment queries"""
        return Payment.objects.select_related(
            'loan', 'loan__user', 'loan__user__profile'
        )
    
    @action(detail=False, methods=['get'])
    def payment_analytics(self, request):
        """Get payment analytics with caching"""
        cache_key = "payment_analytics"
        analytics = cache.get(cache_key)
        
        if analytics is None:
            queryset = self.get_queryset()
            analytics = {
                'total_payments': queryset.count(),
                'successful_payments': queryset.filter(status='completed').count(),
                'failed_payments': queryset.filter(status='failed').count(),
                'pending_payments': queryset.filter(status='pending').count(),
                'total_amount_processed': queryset.filter(status='completed').aggregate(
                    Sum('amount'))['amount__sum'] or 0,
                'average_payment_amount': queryset.filter(status='completed').aggregate(
                    Avg('amount'))['amount__avg'] or 0,
            }
            cache.set(cache_key, analytics, 600)  # Cache for 10 minutes
        
        return Response(analytics)

class OptimizedLoanProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Optimized LoanProduct ViewSet (read-only for better performance)
    """
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['loan_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'min_amount', 'max_amount']
    ordering = ['name']
    
    @method_decorator(cache_page(1800))  # Cache for 30 minutes
    def list(self, request, *args, **kwargs):
        """Heavily cached loan products"""
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(1800))
    def retrieve(self, request, *args, **kwargs):
        """Cached individual loan product"""
        return super().retrieve(request, *args, **kwargs)

# Dashboard Analytics View
class DashboardAnalyticsView(viewsets.ViewSet):
    """
    High-performance dashboard analytics
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get dashboard overview with heavy caching"""
        cache_key = "dashboard_overview"
        overview = cache.get(cache_key)
        
        if overview is None:
            # Use raw SQL for better performance on large datasets
            from django.db import connection
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_users,
                        COUNT(CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) THEN 1 END) as new_users_this_month
                    FROM accounts_userprofile
                """)
                user_stats = cursor.fetchone()
                
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_loans,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
                        SUM(CASE WHEN status = 'active' THEN principal_amount ELSE 0 END) as total_outstanding
                    FROM accounts_loan
                """)
                loan_stats = cursor.fetchone()
                
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_payments,
                        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_collected
                    FROM accounts_payment
                    WHERE created_at >= date_trunc('month', CURRENT_DATE)
                """)
                payment_stats = cursor.fetchone()
            
            overview = {
                'users': {
                    'total': user_stats[0],
                    'new_this_month': user_stats[1],
                },
                'loans': {
                    'total': loan_stats[0],
                    'active': loan_stats[1],
                    'total_outstanding': float(loan_stats[2] or 0),
                },
                'payments': {
                    'total_this_month': payment_stats[0],
                    'amount_collected_this_month': float(payment_stats[1] or 0),
                }
            }
            cache.set(cache_key, overview, 300)
        
        return Response(overview)
