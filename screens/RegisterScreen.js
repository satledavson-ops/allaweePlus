import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic account info
    email: '',
    password: '',
    password2: '',
    
    // Personal Information
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    
    // NYSC Information
    call_up_number: '',
    state_code: '',
    service_year: '2024',
    batch: '',
    ppa: '',
    service_start_date: '',
    service_end_date: '',
    
    // Salary Account Information
    salary_account_number: '',
    bank_name: '',
    bvn: '',
    
    // Next of Kin
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    // Validation for required fields
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || 
        !formData.phone || !formData.date_of_birth || !formData.state_code || 
        !formData.service_year || !formData.service_start_date || 
        !formData.salary_account_number || !formData.bank_name || !formData.bvn ||
        !formData.next_of_kin_name || !formData.next_of_kin_phone || !formData.next_of_kin_relationship) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    if (formData.password !== formData.password2) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const result = await ApiService.register(formData);
      Alert.alert('Success', 'Registration successful! Please login with your credentials.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>NYSC Member Registration</Text>
      <Text style={styles.subtitle}>Join AllaweePlus - Your trusted loan partner</Text>
      
      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email Address *"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password *"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password *"
          value={formData.password2}
          onChangeText={(value) => handleInputChange('password2', value)}
          secureTextEntry
        />
      </View>
      
      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="First Name *"
          value={formData.first_name}
          onChangeText={(value) => handleInputChange('first_name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Last Name *"
          value={formData.last_name}
          onChangeText={(value) => handleInputChange('last_name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD) *"
          value={formData.date_of_birth}
          onChangeText={(value) => handleInputChange('date_of_birth', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          multiline
        />
      </View>

      {/* NYSC Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NYSC Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Call-up Number"
          value={formData.call_up_number}
          onChangeText={(value) => handleInputChange('call_up_number', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="State Code *"
          value={formData.state_code}
          onChangeText={(value) => handleInputChange('state_code', value)}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Service Year *</Text>
          <Picker
            selectedValue={formData.service_year}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('service_year', value)}
          >
            {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
              <Picker.Item key={year} label={year.toString()} value={year.toString()} />
            ))}
          </Picker>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Batch"
          value={formData.batch}
          onChangeText={(value) => handleInputChange('batch', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="PPA (Place of Primary Assignment)"
          value={formData.ppa}
          onChangeText={(value) => handleInputChange('ppa', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Service Start Date (YYYY-MM-DD) *"
          value={formData.service_start_date}
          onChangeText={(value) => handleInputChange('service_start_date', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Service End Year (YYYY)"
          value={formData.service_end_date}
          onChangeText={(value) => handleInputChange('service_end_date', value)}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      {/* Salary Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Account Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="NYSC Salary Account Number *"
          value={formData.salary_account_number}
          onChangeText={(value) => handleInputChange('salary_account_number', value)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Bank Name *"
          value={formData.bank_name}
          onChangeText={(value) => handleInputChange('bank_name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="BVN *"
          value={formData.bvn}
          onChangeText={(value) => handleInputChange('bvn', value)}
          keyboardType="numeric"
        />
      </View>

      {/* Next of Kin */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next of Kin</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Next of Kin Name *"
          value={formData.next_of_kin_name}
          onChangeText={(value) => handleInputChange('next_of_kin_name', value)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Next of Kin Phone *"
          value={formData.next_of_kin_phone}
          onChangeText={(value) => handleInputChange('next_of_kin_phone', value)}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Relationship *"
          value={formData.next_of_kin_relationship}
          onChangeText={(value) => handleInputChange('next_of_kin_relationship', value)}
        />
      </View>

      <TouchableOpacity 
        style={[styles.registerButton, loading && styles.disabledButton]} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.registerButtonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginLink} 
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginLinkText}>Already have an account? Login here</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B006E',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B006E',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 48,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
  picker: {
    height: 40,
    marginHorizontal: -15,
  },
  registerButton: {
    backgroundColor: '#A259C6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginLinkText: {
    color: '#A259C6',
    fontSize: 16,
  },
});
