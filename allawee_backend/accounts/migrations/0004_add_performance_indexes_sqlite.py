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
        # Loan Application Optimizations
        # migrations.RunSQL(
        #     # User Profile Optimizations (SQLite compatible)
        #     "CREATE INDEX IF NOT EXISTS idx_userprofile_bvn ON accounts_userprofile(bvn);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_userprofile_bvn;"
        # ),
        # migrations.RunSQL(
        #     "CREATE INDEX IF NOT EXISTS idx_userprofile_phone ON accounts_userprofile(phone_number);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_userprofile_phone;"
        # ),
        # migrations.RunSQL(
        #     "CREATE INDEX IF NOT EXISTS idx_userprofile_created_at ON accounts_userprofile(created_at);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_userprofile_created_at;"
        # ),
        # migrations.RunSQL(
        #     "CREATE INDEX IF NOT EXISTS idx_userprofile_nysc_state ON accounts_userprofile(nysc_state_code);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_userprofile_nysc_state;"
        # ),
        # 
        # migrations.RunSQL(
        #     "CREATE INDEX IF NOT EXISTS idx_loanapplication_status ON accounts_loanapplication(status);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_status;"
        # ),
        # migrations.RunSQL(
        #     "CREATE INDEX IF NOT EXISTS idx_loanapplication_created_at ON accounts_loanapplication(created_at);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_created_at;"
        # ),
        # migrations.RunSQL(
        #     "CREATE INDEX IF NOT EXISTS idx_loanapplication_loan_id ON accounts_loanapplication(loan_id);",
        #     reverse_sql="DROP INDEX IF EXISTS idx_loanapplication_loan_id;"
        # ),
        
    ]
    # All custom index migrations commented out to prevent schema errors
