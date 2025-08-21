import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

export default function LoanApplicationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loanProducts, setLoanProducts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    loan_product: '',
    amount: '',
    purpose: '',
    repayment_months: '1',
    disbursement_account: '',
    disbursement_bank: '',
  });

  useEffect(() => {
    loadLoanProducts();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getUserProfile();
      setUserProfile(profile);
      // Auto-populate disbursement account with NYSC salary account
      setFormData(prev => ({
        ...prev,
        disbursement_account: profile.salary_account_number || '',
        disbursement_bank: profile.bank_name || '',
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to load user profile');
    }
  };

  const loadLoanProducts = async () => {
    try {
      const products = await ApiService.getLoanProducts();
      setLoanProducts(products);
      if (products.length > 0) {
        setFormData(prev => ({ ...prev, loan_product: products[0].id.toString() }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load loan products');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate repayment based on selected loan product
  const calculateRepayment = () => {
    const amount = parseFloat(formData.amount) || 0;
    const product = loanProducts.find(p => p.id.toString() === formData.loan_product);
    
    if (!product) return { principal: 0, interest: 0, total: 0, interestRate: 0 };
    
    const interestRate = parseFloat(product.interest_rate);
    const interest = amount * (interestRate / 100);
    
    return {
      principal: amount,
      interest,
      total: amount + interest,
      interestRate
    };
  };

  const repaymentInfo = calculateRepayment();

  const handleLoanApplication = async () => {
    if (!formData.amount || !formData.purpose || !formData.disbursement_account || !formData.disbursement_bank) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    const product = loanProducts.find(p => p.id.toString() === formData.loan_product);
    
    if (!product) {
      Alert.alert('Error', 'Please select a loan product');
      return;
    }

    if (amount < product.min_amount || amount > product.max_amount) {
      Alert.alert('Error', `Loan amount must be between ₦${product.min_amount.toLocaleString()} and ₦${product.max_amount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    
    try {
      const applicationData = {
        ...formData,
        amount: parseFloat(formData.amount),
        loan_product: parseInt(formData.loan_product),
        repayment_months: parseInt(formData.repayment_months),
      };
      
      const result = await ApiService.applyForLoan(applicationData);
      
      Alert.alert(
        'Loan Application Submitted',
        `Your loan application for ₦${formData.amount} has been submitted successfully. Application ID: ${result.id}. You will be notified of the decision within 24 hours.`,
        [
          { text: 'OK', onPress: () => navigation.navigate('RepaymentDashboard') }
        ]
      );
    } catch (error) {
      Alert.alert('Application Failed', error.message || 'Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Loan Application</Text>
      <Text style={styles.subtitle}>Quick loans for NYSC members</Text>
      
      {/* Loan Product Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Loan Product</Text>
        
        {loanProducts.length > 0 ? (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.loan_product}
              onValueChange={(value) => handleInputChange('loan_product', value)}
              style={styles.picker}
            >
              {loanProducts.map(product => (
                <Picker.Item
                  key={product.id}
                  label={`${product.name} - ${product.interest_rate}% interest`}
                  value={product.id.toString()}
                />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={styles.loadingText}>Loading loan products...</Text>
        )}
      </View>

      {/* Loan Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Loan Amount (₦)"
          value={formData.amount}
          onChangeText={(value) => handleInputChange('amount', value)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Purpose of Loan"
          value={formData.purpose}
          onChangeText={(value) => handleInputChange('purpose', value)}
          multiline
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Repayment Term</Text>
          <Picker
            selectedValue={formData.repayment_months}
            onValueChange={(value) => handleInputChange('repayment_months', value)}
            style={styles.picker}
          >
            <Picker.Item label="1 Month" value="1" />
          </Picker>
        </View>
      </View>

      {/* Repayment Calculator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repayment Breakdown</Text>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Loan Amount:</Text>
          <Text style={styles.calculationValue}>₦{repaymentInfo.principal.toLocaleString()}</Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Interest ({repaymentInfo.interestRate}%):</Text>
          <Text style={styles.calculationValue}>₦{repaymentInfo.interest.toLocaleString()}</Text>
        </View>
        
        <View style={[styles.calculationRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Repayment:</Text>
          <Text style={styles.totalValue}>₦{repaymentInfo.total.toLocaleString()}</Text>
        </View>
        
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Monthly Payment:</Text>
          <Text style={styles.calculationValue}>
            ₦{(repaymentInfo.total / parseInt(formData.repayment_months || 1)).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Disbursement Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disbursement Account</Text>
        <Text style={styles.autoFillNote}>
          🔒 Auto-filled from your NYSC salary account details
        </Text>
        
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          placeholder="Account Number"
          value={formData.disbursement_account}
          editable={false}
        />
        
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          placeholder="Bank Name"
          value={formData.disbursement_bank}
          editable={false}
        />
        
        <Text style={styles.helpText}>
          These details are automatically taken from your registration. If you need to update them, please contact support.
        </Text>
      </View>

      {/* Security Notice */}
      <View style={styles.noticeContainer}>
        <Text style={styles.noticeTitle}>🔒 Secure Processing</Text>
        <Text style={styles.noticeText}>
          Your application and personal data are protected with bank-level encryption. We securely verify your information and process applications with complete confidentiality. Approved loans are disbursed within 24 hours.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.disabledButton]} 
        onPress={handleLoanApplication}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Application</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B006E',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#A259C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#A259C6',
    color: '#fff',
    borderColor: '#A259C6',
  },
  autoFillNote: {
    fontSize: 14,
    color: '#A259C6',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A259C6',
  },
  calculationLabel: {
    fontSize: 16,
    color: '#888',
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B006E',
  },
  totalRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#4B006E',
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B006E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B006E',
  },
  noticeContainer: {
    backgroundColor: '#A259C6',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4B006E',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B006E',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#4B006E',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#A259C6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
