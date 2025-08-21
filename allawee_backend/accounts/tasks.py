"""
Background tasks for AllaweePlus - Optimized for high-volume processing
"""

from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Q
from django.core.cache import cache
from django.contrib.sessions.models import Session
import logging
from datetime import datetime, timedelta

from .models import Loan, Payment, RepaymentSchedule, UserProfile

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def process_loan_application(self, application_id):
    """
    Process loan application asynchronously
    """
    try:
        from .models import LoanApplication
        application = LoanApplication.objects.get(id=application_id)
        
        # Simulate loan processing logic
        # In production, this would include credit checks, document verification, etc.
        
        # Update application status
        application.status = 'under_review'
        application.save()
        
        # Clear cache
        cache.delete_pattern("loan_application_stats*")
        cache.delete(f"user_loan_summary_{application.user.profile.id}")
        
        logger.info(f"Loan application {application.loan_id} processed successfully")
        return f"Application {application.loan_id} processed"
        
    except Exception as exc:
        logger.error(f"Error processing loan application {application_id}: {exc}")
        self.retry(countdown=60, exc=exc)

@shared_task(bind=True, max_retries=3)
def process_payment(self, payment_id):
    """
    Process payment asynchronously
    """
    try:
        payment = Payment.objects.get(id=payment_id)
        
        # Simulate payment processing
        # In production, this would integrate with payment gateways
        
        payment.status = 'completed'
        payment.save()
        
        # Update loan balance
        loan = payment.loan
        loan.outstanding_balance -= payment.amount
        loan.save()
        
        # Clear related caches
        cache.delete(f"loan_repayment_schedule_{loan.id}")
        cache.delete("payment_analytics")
        cache.delete("dashboard_overview")
        
        logger.info(f"Payment {payment.payment_id} processed successfully")
        return f"Payment {payment.payment_id} processed"
        
    except Exception as exc:
        logger.error(f"Error processing payment {payment_id}: {exc}")
        self.retry(countdown=60, exc=exc)

@shared_task
def update_overdue_payments():
    """
    Update overdue payment status - runs hourly
    """
    try:
        today = timezone.now().date()
        
        # Find overdue repayment schedules
        overdue_schedules = RepaymentSchedule.objects.filter(
            due_date__lt=today,
            is_paid=False,
            is_overdue=False
        )
        
        count = 0
        for schedule in overdue_schedules:
            days_overdue = (today - schedule.due_date).days
            schedule.is_overdue = True
            schedule.days_overdue = days_overdue
            
            # Calculate late fee (2% per day, max 10% of installment)
            late_fee = min(
                schedule.total_amount * 0.02 * days_overdue,
                schedule.total_amount * 0.10
            )
            schedule.late_fee = late_fee
            schedule.save()
            count += 1
        
        # Clear related caches
        cache.delete_pattern("*repayment*")
        cache.delete("dashboard_overview")
        
        logger.info(f"Updated {count} overdue payments")
        return f"Updated {count} overdue payments"
        
    except Exception as exc:
        logger.error(f"Error updating overdue payments: {exc}")
        return f"Error: {exc}"

@shared_task
def send_payment_reminders():
    """
    Send payment reminders to users - runs daily
    """
    try:
        # Find payments due in 3 days
        reminder_date = timezone.now().date() + timedelta(days=3)
        
        due_schedules = RepaymentSchedule.objects.filter(
            due_date=reminder_date,
            is_paid=False
        ).select_related('loan', 'loan__user', 'loan__user__profile')
        
        count = 0
        for schedule in due_schedules:
            user_profile = schedule.loan.user.profile
            
            # Send email reminder
            send_mail(
                subject='Payment Reminder - AllaweePlus',
                message=f'Dear {user_profile.full_name},\n\n'
                       f'This is a reminder that your loan payment of ₦{schedule.total_amount} '
                       f'is due on {schedule.due_date}.\n\n'
                       f'Loan ID: {schedule.loan.loan_id}\n'
                       f'Installment: {schedule.installment_number}\n\n'
                       f'Please make your payment on time to avoid late fees.\n\n'
                       f'Thank you,\nAllaweePlus Team',
                from_email='noreply@allaweplus.com',
                recipient_list=[schedule.loan.user.email],
                fail_silently=True,
            )
            count += 1
        
        logger.info(f"Sent {count} payment reminders")
        return f"Sent {count} payment reminders"
        
    except Exception as exc:
        logger.error(f"Error sending payment reminders: {exc}")
        return f"Error: {exc}"

@shared_task
def cleanup_old_sessions():
    """
    Clean up expired sessions - runs daily
    """
    try:
        Session.objects.filter(expire_date__lt=timezone.now()).delete()
        logger.info("Cleaned up expired sessions")
        return "Cleaned up expired sessions"
        
    except Exception as exc:
        logger.error(f"Error cleaning up sessions: {exc}")
        return f"Error: {exc}"

@shared_task
def generate_daily_reports():
    """
    Generate daily reports and cache them - runs daily
    """
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Generate comprehensive daily statistics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today_applications,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
                    SUM(CASE WHEN status = 'approved' THEN requested_amount ELSE 0 END) as total_approved_amount
                FROM accounts_loanapplication
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            """)
            loan_stats = cursor.fetchone()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_collected,
                    COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as today_payments
                FROM accounts_payment
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            """)
            payment_stats = cursor.fetchone()
        
        daily_report = {
            'date': timezone.now().date().isoformat(),
            'loan_applications': {
                'total_last_30_days': loan_stats[0],
                'today': loan_stats[1],
                'approved': loan_stats[2],
                'total_approved_amount': float(loan_stats[3] or 0),
            },
            'payments': {
                'total_last_30_days': payment_stats[0],
                'total_collected': float(payment_stats[1] or 0),
                'today': payment_stats[2],
            }
        }
        
        # Cache the report for quick access
        cache.set('daily_report', daily_report, 86400)  # Cache for 24 hours
        
        logger.info("Generated daily report")
        return "Generated daily report"
        
    except Exception as exc:
        logger.error(f"Error generating daily report: {exc}")
        return f"Error: {exc}"

@shared_task(bind=True, max_retries=3)
def bulk_import_users(self, user_data_list):
    """
    Bulk import users for large-scale onboarding
    """
    try:
        from django.contrib.auth.models import User
        
        created_count = 0
        error_count = 0
        
        for user_data in user_data_list:
            try:
                # Create user and profile
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password']
                )
                
                UserProfile.objects.create(
                    user=user,
                    full_name=user_data['full_name'],
                    phone_number=user_data['phone_number'],
                    bvn=user_data['bvn'],
                    nysc_state_code=user_data['nysc_state_code']
                )
                
                created_count += 1
                
            except Exception as e:
                logger.error(f"Error creating user {user_data.get('username')}: {e}")
                error_count += 1
        
        # Clear user-related caches
        cache.delete_pattern("user_profiles*")
        cache.delete("dashboard_overview")
        
        result = f"Bulk import completed: {created_count} users created, {error_count} errors"
        logger.info(result)
        return result
        
    except Exception as exc:
        logger.error(f"Error in bulk import: {exc}")
        self.retry(countdown=60, exc=exc)

@shared_task
def optimize_database():
    """
    Database optimization task - runs weekly
    """
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Analyze and vacuum tables for better performance
            cursor.execute("ANALYZE accounts_userprofile;")
            cursor.execute("ANALYZE accounts_loanapplication;")
            cursor.execute("ANALYZE accounts_loan;")
            cursor.execute("ANALYZE accounts_payment;")
            cursor.execute("ANALYZE accounts_repaymentschedule;")
        
        logger.info("Database optimization completed")
        return "Database optimization completed"
        
    except Exception as exc:
        logger.error(f"Error optimizing database: {exc}")
        return f"Error: {exc}"
