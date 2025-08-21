#!/usr/bin/env python3
"""
AllaweePlus Load Test Data Generator
Creates test data to demonstrate scalability
"""

import os
import sys
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Add Django path
sys.path.append('/Users/mac/AllaweePlus/allawee_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile, LoanProduct, LoanApplication, Loan, Payment

def create_test_users(count=100):
    """Create test users and profiles"""
    print(f"📊 Creating {count} test users...")
    
    created_count = 0
    
    for i in range(count):
        try:
            # Create user
            username = f"testuser{i:04d}"
            email = f"testuser{i:04d}@test.com"
            
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password="testpass123",
                    first_name=f"Test{i}",
                    last_name="User"
                )
                
                # Create profile
                UserProfile.objects.create(
                    user=user,
                    full_name=f"Test User {i:04d}",
                    nysc_state_code=random.choice(["LA", "AB", "OG", "KN", "FC", "EN", "KD", "PL"]),
                    bank_details=f"Bank Account {i:04d}",
                    bvn=f"{1000000000 + i:011d}",
                    phone_number=f"080{i:08d}",
                    date_of_birth=datetime.now().date() - timedelta(days=random.randint(20*365, 30*365)),
                    nysc_start_date=datetime.now().date() - timedelta(days=random.randint(30, 365)),
                    nysc_end_date=datetime.now().date() + timedelta(days=random.randint(30, 365)),
                    monthly_allowance=Decimal(str(random.randint(30000, 35000)))
                )
                
                created_count += 1
                
                if created_count % 10 == 0:
                    print(f"  Created {created_count} users...")
                    
        except Exception as e:
            print(f"  Error creating user {i}: {e}")
    
    print(f"✅ Created {created_count} test users")
    return created_count

def create_loan_products():
    """Create sample loan products if they don't exist"""
    print("📋 Creating loan products...")
    
    products = [
        {
            'name': 'NYSC Emergency Loan',
            'loan_type': 'emergency',
            'min_amount': Decimal('5000.00'),
            'max_amount': Decimal('50000.00'),
            'interest_rate': Decimal('15.00'),
            'max_tenure_months': 6,
            'processing_fee_percentage': Decimal('2.5'),
            'description': 'Quick emergency loans for NYSC members'
        },
        {
            'name': 'NYSC Education Loan',
            'loan_type': 'education',
            'min_amount': Decimal('10000.00'),
            'max_amount': Decimal('100000.00'),
            'interest_rate': Decimal('12.00'),
            'max_tenure_months': 12,
            'processing_fee_percentage': Decimal('3.0'),
            'description': 'Educational loans for skill development'
        },
        {
            'name': 'NYSC Business Startup',
            'loan_type': 'business',
            'min_amount': Decimal('20000.00'),
            'max_amount': Decimal('200000.00'),
            'interest_rate': Decimal('18.00'),
            'max_tenure_months': 18,
            'processing_fee_percentage': Decimal('4.0'),
            'description': 'Business startup loans for entrepreneurs'
        }
    ]
    
    created_count = 0
    for product_data in products:
        product, created = LoanProduct.objects.get_or_create(
            name=product_data['name'],
            defaults=product_data
        )
        if created:
            created_count += 1
            print(f"  ✅ Created: {product.name}")
    
    print(f"✅ Loan products ready ({created_count} new)")
    return LoanProduct.objects.count()

def create_loan_applications(count=50):
    """Create test loan applications"""
    print(f"📝 Creating {count} loan applications...")
    
    users = list(User.objects.filter(username__startswith='testuser'))
    loan_products = list(LoanProduct.objects.all())
    
    if not users or not loan_products:
        print("❌ Need users and loan products first")
        return 0
    
    created_count = 0
    
    for i in range(count):
        try:
            user = random.choice(users)
            loan_product = random.choice(loan_products)
            
            # Random amount within product limits
            amount = random.randint(
                int(loan_product.min_amount),
                int(loan_product.max_amount)
            )
            
            application = LoanApplication.objects.create(
                applicant=user,
                loan_product=loan_product,
                requested_amount=Decimal(str(amount)),
                tenure_months=random.randint(3, loan_product.max_tenure_months),
                purpose=random.choice([
                    "Emergency expense",
                    "Medical bills",
                    "Education fees",
                    "Business investment",
                    "Family support"
                ]),
                status=random.choice(['pending', 'under_review', 'approved', 'rejected']),
                application_date=datetime.now().date() - timedelta(days=random.randint(0, 60))
            )
            
            # Some applications become loans
            if application.status == 'approved' and random.random() < 0.7:
                create_loan_from_application(application)
            
            created_count += 1
            
            if created_count % 10 == 0:
                print(f"  Created {created_count} applications...")
                
        except Exception as e:
            print(f"  Error creating application {i}: {e}")
    
    print(f"✅ Created {created_count} loan applications")
    return created_count

def create_loan_from_application(application):
    """Create a loan from approved application"""
    try:
        # Calculate loan details
        principal = application.approved_amount or application.requested_amount
        interest_amount = principal * (application.loan_product.interest_rate / 100) * (application.tenure_months / 12)
        total_amount = principal + interest_amount
        monthly_payment = total_amount / application.tenure_months
        
        loan = Loan.objects.create(
            application=application,
            principal_amount=principal,
            interest_amount=interest_amount,
            total_amount=total_amount,
            monthly_payment=monthly_payment,
            status=random.choice(['active', 'completed', 'defaulted']),
            disbursement_date=datetime.now().date() - timedelta(days=random.randint(0, 30)),
            maturity_date=datetime.now().date() + timedelta(days=application.tenure_months * 30),
            outstanding_balance=total_amount * random.uniform(0.2, 1.0)  # Random remaining balance
        )
        
        # Create some payments
        payment_count = random.randint(0, min(3, application.tenure_months))
        for p in range(payment_count):
            Payment.objects.create(
                loan=loan,
                amount=monthly_payment,
                payment_method=random.choice(['bank_transfer', 'card', 'remita']),
                status=random.choice(['completed', 'pending', 'failed']),
                payment_date=datetime.now().date() - timedelta(days=random.randint(0, 60)),
                due_date=datetime.now().date() - timedelta(days=random.randint(-30, 30))
            )
        
    except Exception as e:
        print(f"  Error creating loan for application {application.application_id}: {e}")

def generate_performance_test_data():
    """Generate comprehensive test data for performance testing"""
    print("🎯 AllaweePlus Test Data Generator")
    print("=" * 50)
    
    # Step 1: Create loan products
    products_count = create_loan_products()
    
    # Step 2: Create test users
    users_count = create_test_users(200)  # Create 200 test users
    
    # Step 3: Create loan applications
    applications_count = create_loan_applications(150)  # 150 applications
    
    # Step 4: Show summary
    print("\n📊 TEST DATA SUMMARY:")
    print(f"  👥 Users: {User.objects.count():,}")
    print(f"  📋 Loan Products: {LoanProduct.objects.count():,}")
    print(f"  📝 Applications: {LoanApplication.objects.count():,}")
    print(f"  💰 Active Loans: {Loan.objects.count():,}")
    print(f"  💳 Payments: {Payment.objects.count():,}")
    
    total_records = (User.objects.count() + 
                    LoanProduct.objects.count() + 
                    LoanApplication.objects.count() + 
                    Loan.objects.count() + 
                    Payment.objects.count())
    
    print(f"  📊 Total Records: {total_records:,}")
    print(f"  📈 Capacity Used: {(total_records/500000)*100:.2f}% of 500,000 target")
    
    print("\n✅ Test data generation complete!")
    print("🔍 Run performance monitor to see the impact:")
    print("  python monitor.py --single")

def clear_test_data():
    """Clear all test data"""
    print("🗑️  Clearing test data...")
    
    # Delete in reverse order of dependencies
    Payment.objects.filter(loan__application__applicant__username__startswith='testuser').delete()
    Loan.objects.filter(application__applicant__username__startswith='testuser').delete()
    LoanApplication.objects.filter(applicant__username__startswith='testuser').delete()
    UserProfile.objects.filter(user__username__startswith='testuser').delete()
    User.objects.filter(username__startswith='testuser').delete()
    
    print("✅ Test data cleared")

def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == '--clear':
            clear_test_data()
        elif sys.argv[1] == '--help':
            print("AllaweePlus Test Data Generator")
            print("Usage:")
            print("  python generate_test_data.py          # Generate test data")
            print("  python generate_test_data.py --clear  # Clear test data")
            print("  python generate_test_data.py --help   # Show help")
        else:
            print("Unknown option. Use --help for usage.")
    else:
        generate_performance_test_data()

if __name__ == "__main__":
    main()
