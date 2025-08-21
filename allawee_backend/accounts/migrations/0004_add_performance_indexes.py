"""
Database optimization migration for SQLite (development) - Compatible version
"""

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_loanproduct_userprofile_created_at_and_more'),
    ]

    operations = [
        # Add database indexes for SQLite
        migrations.RunSQL(
            # User Profile Optimizations (SQLite compatible)
            "CREATE INDEX IF NOT EXISTS idx_userprofile_bvn ON accounts_userprofile(bvn);",
            reverse_sql="DROP INDEX IF EXISTS idx_userprofile_bvn;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_userprofile_phone ON accounts_userprofile(phone_number);",
            reverse_sql="DROP INDEX IF EXISTS idx_userprofile_phone;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_userprofile_created_at ON accounts_userprofile(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_userprofile_created_at;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_userprofile_nysc_state ON accounts_userprofile(nysc_state_code);",
            reverse_sql="DROP INDEX IF EXISTS idx_userprofile_nysc_state;"
        ),
        
        # Loan Application Optimizations
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loanapplication_status ON accounts_loanapplication(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loanapplication_applicant_status ON accounts_loanapplication(applicant_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_applicant_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loanapplication_created_at ON accounts_loanapplication(application_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_created_at;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loanapplication_loan_id ON accounts_loanapplication(application_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_loan_id;"
        ),
        
        # Loan Optimizations
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loan_status ON accounts_loan(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_loan_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loan_loan_id ON accounts_loan(loan_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_loan_loan_id;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loan_application_status ON accounts_loan(application_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_loan_application_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loan_disbursement_date ON accounts_loan(disbursement_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_loan_disbursement_date;"
        ),
        
        # Payment Optimizations
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_payment_status ON accounts_payment(status);",
            reverse_sql="DROP INDEX IF EXISTS idx_payment_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_payment_payment_id ON accounts_payment(payment_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_payment_payment_id;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_payment_loan_status ON accounts_payment(loan_id, status);",
            reverse_sql="DROP INDEX IF EXISTS idx_payment_loan_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_payment_created_at ON accounts_payment(created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_payment_created_at;"
        ),
        
        # Composite indexes for common query patterns
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loan_application_created ON accounts_loan(application_id, created_at);",
            reverse_sql="DROP INDEX IF EXISTS idx_loan_application_created;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_loanapp_applicant_created ON accounts_loanapplication(applicant_id, application_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_loanapp_applicant_created;"
        ),
    ]
