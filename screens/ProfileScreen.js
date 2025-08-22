// screens/ProfileScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isAuthed, logout: doLogout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userData, setUserData] = useState(null);

  const safe = (v, fallback = '—') =>
    v === null || v === undefined || v === '' ? fallback : v;

  // Normalize backend → UI shape your screen expects
  const mapProfileToUI = (p = {}) => {
    const firstName =
      p.first_name || (p.full_name ? String(p.full_name).split(' ')[0] : '—');
    const lastName =
      p.last_name ||
      (p.full_name ? String(p.full_name).split(' ').slice(1).join(' ') : '');

    return {
      personalInfo: {
        firstName: safe(firstName),
        lastName: safe(lastName),
        email: safe(p.email),
        phone: safe(p.phone),
        dateOfBirth: safe(p.dob),
        address: safe(p.address),
      },
      nyscInfo: {
        callUpNumber: safe(p.nysc_callup_no),
        stateCode: safe(p.nysc_state_code),
        serviceYear: safe(p.nysc_year),
        batch: safe(p.nysc_batch),
        startDate: safe(p.nysc_start),
        endDate: safe(p.nysc_end),
        ppa: safe(p.nysc_ppa),
        orientation: safe(p.nysc_orientation_status),
        cds: safe(p.nysc_cds),
      },
      bankInfo: {
        accountName: safe(p.bank_account_name || `${firstName} ${lastName}`.trim()),
        accountNumber: safe(p.bank_account_number),
        bankName: safe(p.bank_name),
        bvn: p.bvn || '',
        salaryAccount: !!p.salary_verified,
      },
      nextOfKin: {
        name: safe(p.nok_name),
        relationship: safe(p.nok_relationship),
        phone: safe(p.nok_phone),
        address: safe(p.nok_address),
      },
      appInfo: {
        memberSince: safe(
          p.created_at && p.created_at.slice ? p.created_at.slice(0, 10) : '—'
        ),
        creditScore: Number.isFinite(p.credit_score) ? p.credit_score : 0,
        totalLoansApplied: Number.isFinite(p.loans_applied) ? p.loans_applied : 0,
        totalLoansRepaid: Number.isFinite(p.loans_repaid) ? p.loans_repaid : 0,
        loanStatus: safe(p.loan_status || 'Good Standing'),
      },
    };
  };

  useEffect(() => {
    if (!isAuthed) {
      // If user isn’t authed, bounce to Welcome
      navigation.replace('Welcome');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const getProfile = ApiService?.getProfile;
        const raw = getProfile ? await getProfile() : {};
        if (!cancelled) setUserData(mapProfileToUI(raw || {}));
      } catch (e) {
        if (!cancelled) {
          Alert.alert('Error', 'Failed to load profile.');
          setUserData(mapProfileToUI({})); // keep UI rendering
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, navigation]);

  const maskedBVN = useMemo(() => {
    const bvn = userData?.bankInfo?.bvn || '';
    return bvn && bvn.length >= 4 ? `***-***-${bvn.slice(-4)}` : '***-***-****';
  }, [userData]);

  // Actions
  const handleEditProfile = () => navigation.navigate('ProfileSetup');

  const handleChangePassword = () => navigation.navigate('ForgotPassword');

  const handleRemitaSync = async () => {
    try {
      setSyncing(true);
      const verify = ApiService?.verifySalary;
      if (verify) await verify();
      setUserData((prev) =>
        prev ? { ...prev, bankInfo: { ...prev.bankInfo, salaryAccount: true } } : prev
      );
      Alert.alert('Success', 'Your salary information has been synced!');
    } catch {
      Alert.alert('Error', 'Salary verification failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            if (ApiService?.logout) await ApiService.logout();
          } finally {
            // Update auth state and return to Welcome
            await doLogout();
            navigation.replace('Welcome');
          }
        },
      },
    ]);
  };

  // Loading state
  if (loading || !userData) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 60 }}>
        <Text style={styles.title}>Profile</Text>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ActivityIndicator />
          <Text style={{ color: '#666', marginTop: 8 }}>Loading profile…</Text>
        </View>
      </ScrollView>
    );
  }

  // UI (unchanged)
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header */}
      <Text style={styles.title}>Profile</Text>

      {/* Profile Summary */}
      <View style={styles.profileSummary}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {String(userData.personalInfo.firstName || 'U')[0]}
            {String(userData.personalInfo.lastName || 'S')[0]}
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
          {String(userData.appInfo.loanStatus).toLowerCase().includes('good') && (
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
            <Text style={styles.infoValue}>
              {userData.nyscInfo.serviceYear} Batch {userData.nyscInfo.batch}
            </Text>
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
            <Text style={styles.infoValue}>{maskedBVN}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Salary Account</Text>
            <Text style={[styles.infoValue, styles.salaryStatus]}>
              {userData.bankInfo.salaryAccount ? '✅ Verified' : '❌ Not Verified'}
            </Text>
          </View>
        </View>

        {/* Sync with Remita */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            userData.bankInfo.salaryAccount && { opacity: 0.7 },
          ]}
          onPress={handleRemitaSync}
          disabled={syncing}
        >
          <Text style={styles.actionIcon}>{syncing ? '⏳' : '🔄'}</Text>
          <Text style={styles.actionText}>
            {syncing ? 'Syncing…' : 'Sync with Remita'}
          </Text>
        </TouchableOpacity>
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

        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <Text style={styles.actionIcon}>🔒</Text>
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

/* --------------------- styles (same look you had) --------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#4B006E',
    textAlign: 'center', marginTop: 50, marginBottom: 30,
  },
  profileSummary: {
    backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center',
    paddingVertical: 30, paddingHorizontal: 20, marginBottom: 20, marginHorizontal: 20,
    borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
  },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#4B006E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  avatarText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#444', marginBottom: 5 },
  nyscCode: { fontSize: 16, color: '#888', marginBottom: 10 },
  statusBadge: { backgroundColor: '#4B006E', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  statusText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: {
    backgroundColor: '#4CAF50', width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  verifiedTick: { fontSize: 16, color: 'white', fontWeight: 'bold' },

  statsContainer: {
    flexDirection: 'row', paddingVertical: 20, marginBottom: 20,
    justifyContent: 'space-between', paddingHorizontal: 10,
  },
  statBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20,
    paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center',
    flex: 1, marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#A259C6', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#888', textAlign: 'center' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4B006E', marginBottom: 10, paddingHorizontal: 20 },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.95)', marginHorizontal: 20, borderRadius: 12, padding: 20 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 14, color: '#888', flex: 1 },
  infoValue: { fontSize: 14, color: '#444', fontWeight: '500', flex: 2, textAlign: 'right' },
  salaryStatus: { fontWeight: 'bold' },

  actionsSection: { paddingHorizontal: 20, marginBottom: 20 },
  actionButton: {
    backgroundColor: '#A259C6', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 10,
  },
  actionIcon: { fontSize: 20, marginRight: 15 },
  actionText: { fontSize: 16, color: '#fff', fontWeight: '500' },

  logoutButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#A259C6' },
  logoutText: { color: '#A259C6', fontWeight: 'bold' },

  footer: { height: 30 },
});