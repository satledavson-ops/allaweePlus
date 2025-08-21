import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView } from 'react-native';

const NetworkTest = () => {
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testNetworkConnectivity = async () => {
    setResults([]);
    addResult('🔍 Starting network tests...');
    
    const baseURL = 'http://127.0.0.1:8000';
    
    try {
      // Test 1: Basic connectivity
      addResult('Test 1: Basic connectivity...');
      const response1 = await fetch(`${baseURL}/api/accounts/loan-products/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      addResult(`✅ Basic connectivity: ${response1.status}`);
      
      // Test 2: Login endpoint structure
      addResult('Test 2: Login endpoint...');
      const response2 = await fetch(`${baseURL}/api/accounts/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin12' }),
      });
      
      const loginData = await response2.json();
      addResult(`✅ Login response: ${response2.status}`);
      addResult(`📋 Login data: ${JSON.stringify(loginData, null, 2)}`);
      
      if (loginData.token) {
        addResult(`🎯 Token received: ${loginData.token.substring(0, 10)}...`);
        
        // Test 3: Token usage
        addResult('Test 3: Testing token usage...');
        const response3 = await fetch(`${baseURL}/api/accounts/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${loginData.token}`,
          },
        });
        addResult(`✅ Token test: ${response3.status}`);
      }
      
    } catch (error) {
      addResult(`❌ Network error: ${error.message}`);
      Alert.alert('Network Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Network Connectivity Test
      </Text>
      
      <Button title="Run Network Tests" onPress={testNetworkConnectivity} />
      
      <ScrollView style={{ marginTop: 20, flex: 1 }}>
        {results.map((result, index) => (
          <Text key={index} style={{ marginBottom: 5, fontSize: 12 }}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default NetworkTest;
