import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';

export default function ProfileScreen({ navigation }) {
  // Mock user data - replace with real data from backend
  const [userData, setUserData] = useState({
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@gmail.com',
      phone: '+234 80 1234 5678',
      dateOfBirth: '1990-03-15',
      address: '6th avenue federal lowcost Jos, Plateau State'
    },
    nyscInfo: {
      callUpNumber: 'NYSC/FCT/2023/1234567',
      stateCode: 'PL/23C/4567',
      serviceYear: '2023',
      batch: 'C',
      startDate: '2023-10-01',
      endDate: '2024-09-30',
      ppa: 'Ministry of Education, Plateau State',
      orientation: 'Completed',
      cds: 'Community Development Service - Education'
    },
    bankInfo: {
      accountName: 'John Doe',
      accountNumber: '1234567890',
      bankName: 'First Bank of Nigeria',
      bvn: '12345678901',
      salaryAccount: true
    },
    nextOfKin: {
      name: 'Jane Doe',
      relationship: 'Sister',
      phone: '+234 80 9876 5432',
      address: '6th avenue federal lowcost Jos, Plateau State'
    },
    appInfo: {
      memberSince: '2024-01-15',
      creditScore: 95,
      totalLoansApplied: 2,
      totalLoansRepaid: 1,
      loanStatus: 'Good Standing'
    }
  });

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing feature will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change feature will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleRemitaSync = () => {
    Alert.alert(
      'Sync with Remita',
      'Your salary information has been synced successfully!',
      [{ text: 'OK' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => navigation.navigate('Welcome') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Profile</Text>

      {/* Profile Summary */}
      <View style={styles.profileSummary}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userData.personalInfo.firstName[0]}{userData.personalInfo.lastName[0]}
          </Text>
        </View>
        <Text style={styles.userName}>
          {userData.personalInfo.firstName} {userData.personalInfo.lastName}
        </Text>
        <Text style={styles.nyscCode}>{userData.nyscInfo.stateCode}</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{userData.appInfo.loanStatus}</Text>
          </View>
          {userData.appInfo.loanStatus === 'Good Standing' && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedTick}>✓</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{userData.appInfo.creditScore}%</Text>
          <Text style={styles.statLabel}>Credit Score</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{userData.appInfo.totalLoansApplied}</Text>
          <Text style={styles.statLabel}>Loans Applied</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{userData.appInfo.totalLoansRepaid}</Text>
          <Text style={styles.statLabel}>Loans Repaid</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>
              {userData.personalInfo.firstName} {userData.personalInfo.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData.personalInfo.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{userData.personalInfo.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>{userData.personalInfo.dateOfBirth}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{userData.personalInfo.address}</Text>
          </View>
        </View>
      </View>

      {/* NYSC Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NYSC Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Call-up Number</Text>
            <Text style={styles.infoValue}>{userData.nyscInfo.callUpNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>State Code</Text>
            <Text style={styles.infoValue}>{userData.nyscInfo.stateCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Year</Text>
            <Text style={styles.infoValue}>{userData.nyscInfo.serviceYear} Batch {userData.nyscInfo.batch}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Period</Text>
            <Text style={styles.infoValue}>
              {userData.nyscInfo.startDate} - {userData.nyscInfo.endDate}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PPA</Text>
            <Text style={styles.infoValue}>{userData.nyscInfo.ppa}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CDS Group</Text>
            <Text style={styles.infoValue}>{userData.nyscInfo.cds}</Text>
          </View>
        </View>
      </View>

      {/* Bank Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Name</Text>
            <Text style={styles.infoValue}>{userData.bankInfo.accountName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{userData.bankInfo.accountNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bank</Text>
            <Text style={styles.infoValue}>{userData.bankInfo.bankName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BVN</Text>
            <Text style={styles.infoValue}>***-***-{userData.bankInfo.bvn.slice(-4)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Salary Account</Text>
            <Text style={[styles.infoValue, styles.salaryStatus]}>
              {userData.bankInfo.salaryAccount ? '✅ Verified' : '❌ Not Verified'}
            </Text>
          </View>
        </View>
      </View>

      {/* Next of Kin */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next of Kin</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{userData.nextOfKin.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Relationship</Text>
            <Text style={styles.infoValue}>{userData.nextOfKin.relationship}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{userData.nextOfKin.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{userData.nextOfKin.address}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleRemitaSync}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Sync with Remita</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <Text style={styles.actionIcon}>🔒</Text>
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B006E',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  profileSummary: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4B006E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 5,
  },
  nyscCode: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#4B006E',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedTick: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  statBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B006E',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B006E',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  salaryStatus: {
    fontWeight: 'bold',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#A259C6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  actionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#A259C6',
  },
  logoutText: {
    color: '#A259C6',
    fontWeight: 'bold',
  },
  footer: {
    height: 30,
  },
});