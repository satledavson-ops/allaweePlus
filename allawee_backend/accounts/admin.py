from django.contrib import admin
from django.utils.html import format_html
from .models import (
    UserProfile, LoanProduct, LoanApplication, 
    Loan, Payment, RepaymentSchedule, RemitaTransaction
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'nysc_state_code', 'phone_number', 'salary_account_verified', 'created_at']
    list_filter = ['nysc_state_code', 'salary_account_verified', 'created_at']
    search_fields = ['full_name', 'user__username', 'user__email', 'phone_number', 'bvn']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'full_name', 'phone_number', 'date_of_birth')
        }),
        ('NYSC Details', {
            'fields': ('nysc_state_code', 'nysc_certificate', 'nysc_start_date', 'nysc_end_date', 'monthly_allowance')
        }),
        ('Financial Information', {
            'fields': ('bank_details', 'bvn')
        }),
        ('Remita Integration', {
            'fields': ('remita_mandate_id', 'remita_payer_id', 'salary_account_verified', 'last_salary_verification')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'loan_type', 'min_amount', 'max_amount', 'interest_rate', 'max_tenure_months', 'is_active']
    list_filter = ['loan_type', 'is_active']
    search_fields = ['name']

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ['application_id', 'applicant_name', 'loan_product', 'requested_amount', 'status', 'application_date']
    list_filter = ['status', 'loan_product', 'application_date']
    search_fields = ['application_id', 'applicant__full_name', 'applicant__user__email']
    readonly_fields = ['application_id', 'application_date']
    
    def applicant_name(self, obj):
        return obj.applicant.full_name
    applicant_name.short_description = 'Applicant'
    
    fieldsets = (
        ('Application Details', {
            'fields': ('application_id', 'applicant', 'loan_product', 'application_date')
        }),
        ('Loan Request', {
            'fields': ('requested_amount', 'approved_amount', 'tenure_months', 'interest_rate', 'processing_fee', 'purpose')
        }),
        ('Status & Review', {
            'fields': ('status', 'review_date', 'approval_date', 'disbursement_date', 'reviewed_by', 'review_comments')
        })
    )
@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('loan_id', 'application', 'principal_amount', 'interest_amount', 'total_amount', 'status', 'disbursement_date', 'maturity_date', 'total_paid', 'outstanding_balance', 'auto_deduction_active')
    list_filter = ('status', 'disbursement_date', 'maturity_date', 'auto_deduction_active')
    search_fields = ('loan_id', 'application__applicant__full_name', 'application__applicant__email')
    actions = ['mark_as_closed', 'mark_as_defaulted']

    def mark_as_closed(self, request, queryset):
        updated = queryset.update(status='closed')
        self.message_user(request, f"{updated} loans marked as closed.")
    mark_as_closed.short_description = "Mark selected loans as closed"

    def mark_as_defaulted(self, request, queryset):
        updated = queryset.update(status='defaulted')
        self.message_user(request, f"{updated} loans marked as defaulted.")
    mark_as_defaulted.short_description = "Mark selected loans as defaulted"

    
    def borrower_name(self, obj):
        return obj.application.applicant.full_name
    borrower_name.short_description = 'Borrower'
    
    fieldsets = (
        ('Loan Information', {
            'fields': ('loan_id', 'application', 'created_at')
        }),
        ('Financial Details', {
            'fields': ('principal_amount', 'interest_amount', 'total_amount', 'monthly_payment')
        }),
        ('Payment Tracking', {
            'fields': ('total_paid', 'outstanding_balance', 'status')
        }),
        ('Dates', {
            'fields': ('disbursement_date', 'maturity_date')
        }),
        ('Remita Integration', {
            'fields': ('remita_mandate_id', 'auto_deduction_active')
        })
    )

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'loan_borrower', 'amount', 'payment_method', 'status', 'payment_date']
    list_filter = ['payment_method', 'status', 'payment_date']
    search_fields = ['payment_id', 'loan__loan_id', 'remita_rrr']
    readonly_fields = ['payment_id', 'created_at']
    
    def loan_borrower(self, obj):
        return f"{obj.loan.loan_id} - {obj.loan.application.applicant.full_name}"
    loan_borrower.short_description = 'Loan & Borrower'
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment_id', 'loan', 'amount', 'payment_method', 'status', 'created_at')
        }),
        ('Dates', {
            'fields': ('payment_date', 'due_date')
        }),
        ('Remita Details', {
            'fields': ('remita_rrr', 'remita_transaction_id', 'remita_response')
        }),
        ('Additional Information', {
            'fields': ('reference', 'notes')
        })
    )


@admin.register(RepaymentSchedule)
class RepaymentScheduleAdmin(admin.ModelAdmin):
    list_display = ('loan', 'installment_number', 'due_date', 'principal_amount', 'interest_amount', 'total_amount', 'is_paid', 'payment_date')
    list_filter = ('is_paid', 'due_date')
    search_fields = ('loan__loan_id',)

@admin.register(RemitaTransaction)
class RemitaTransactionAdmin(admin.ModelAdmin):
    list_display = ['remita_rrr', 'user_name', 'transaction_type', 'amount', 'status', 'initiated_at']
    list_filter = ['transaction_type', 'status', 'initiated_at']
    search_fields = ['remita_rrr', 'user_profile__full_name']
    readonly_fields = ['initiated_at']
    
    def user_name(self, obj):
        return obj.user_profile.full_name
    user_name.short_description = 'User'

# Customize admin site
admin.site.site_header = "AllaweePlus Admin Dashboard"
admin.site.site_title = "AllaweePlus Admin"
admin.site.index_title = "Loan Management System"
