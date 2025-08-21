from django.urls import path
from . import views

urlpatterns = [
    # Authentication URLs
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # User Profile URLs
    path('profile/', views.UserProfileDetail.as_view(), name='user-profile'),
    
    # Loan Product URLs
    path('loan-products/', views.LoanProductList.as_view(), name='loan-products'),
    path('loan-products/<int:pk>/', views.LoanProductDetail.as_view(), name='loan-product-detail'),
    
    # Loan Application URLs
    path('loan-applications/', views.LoanApplicationList.as_view(), name='loan-applications'),
    path('loan-applications/<int:pk>/', views.LoanApplicationDetail.as_view(), name='loan-application-detail'),
        path('api/loan-applications/', views.LoanApplicationListCreateView.as_view(), name='loanapplication-list-create'),
    
    # Loan URLs
    path('loans/', views.LoanList.as_view(), name='loans'),
    path('loans/<int:pk>/', views.LoanDetail.as_view(), name='loan-detail'),
    
    # Payment URLs
    path('payments/', views.PaymentList.as_view(), name='payments'),
    path('loans/<int:loan_id>/repayment-schedule/', views.RepaymentScheduleList.as_view(), name='repayment-schedule'),
    
    # Dashboard URLs
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/trends/', views.monthly_trends, name='monthly-trends'),
    path('dashboard/user/', views.user_dashboard, name='user-dashboard'),
    
    # Remita Integration URLs
    path('remita/verify-salary/', views.verify_salary, name='verify-salary'),
    path('remita/setup-mandate/', views.setup_mandate, name='setup-mandate'),
]