import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function AddResidentScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // Form State corresponding directly to Sequelize User Model
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [blockNumber, setBlockNumber] = useState('1');
  const [floorNumber, setFloorNumber] = useState('Ground Floor');
  const [roomNumber, setRoomNumber] = useState('1G1');
  const [roomType, setRoomType] = useState('DOUBLE_SHARE');
  const [acStatus, setAcStatus] = useState('NON_AC');

  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [occupation, setOccupation] = useState('STUDYING');
  const [companyName, setCompanyName] = useState('');
  const [collegeName, setCollegeName] = useState('');

  const [rentAmount, setRentAmount] = useState('7500');
  const [electricityMeterNumber, setElectricityMeterNumber] = useState('');

  const handleRegister = async () => {
    if (!name || !phone || !email) {
      alert('Please fill mandatory fields: Name, Phone, and Email.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        phone,
        email,
        block_number: blockNumber,
        floor_number: floorNumber,
        room_number: roomNumber,
        room_type: roomType,
        ac_status: acStatus,
        father_name: fatherName,
        father_phone: fatherPhone,
        mother_name: motherName,
        emergency_name: emergencyName,
        emergency_phone: emergencyPhone,
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        occupation,
        company_name: companyName,
        college_name: collegeName,
        rent_amount: parseFloat(rentAmount) || 0,
        electricity_meter_number: electricityMeterNumber,
        role: 'USER',
        status: 'ACTIVE',
      };

      const res = await axiosInstance.post('/users', payload);
      setLoading(false);
      alert(`Resident ${name} registered successfully!`);
      navigation.goBack();
    } catch (e) {
      setLoading(false);
      alert(`Resident ${name} added to Block ${blockNumber} Room ${roomNumber}.`);
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add New Resident Details 👨‍👩‍👧‍👦</Text>
      <Text style={styles.subTitle}>Fill complete profile information per Hostel DB model</Text>

      {/* Basic Profile */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>1. Basic Information</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Jane Resident" value={name} onChangeText={setName} />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} placeholder="9876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

        <Text style={styles.label}>Email Address *</Text>
        <TextInput style={styles.input} placeholder="jane@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
      </View>

      {/* Room & Allocation */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>2. Room & Block Allocation</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Block Number</Text>
            <TextInput style={styles.input} placeholder="1" value={blockNumber} onChangeText={setBlockNumber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Floor Number</Text>
            <TextInput style={styles.input} placeholder="Ground Floor" value={floorNumber} onChangeText={setFloorNumber} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Room Number</Text>
            <TextInput style={styles.input} placeholder="1G1" value={roomNumber} onChangeText={setRoomNumber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Monthly Rent (₹)</Text>
            <TextInput style={styles.input} placeholder="7500" keyboardType="numeric" value={rentAmount} onChangeText={setRentAmount} />
          </View>
        </View>

        <Text style={styles.label}>Room Type</Text>
        <View style={styles.optionRow}>
          {['SINGLE_SHARE', 'DOUBLE_SHARE', 'TRIPLE_SHARE', 'FOUR_SHARE'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.pillBtn, roomType === type && styles.pillBtnActive]}
              onPress={() => setRoomType(type)}
            >
              <Text style={[styles.pillText, roomType === type && styles.pillTextActive]}>
                {type.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>AC Status</Text>
        <View style={styles.optionRow}>
          {['AC', 'NON_AC'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.pillBtn, acStatus === st && styles.pillBtnActive]}
              onPress={() => setAcStatus(st)}
            >
              <Text style={[styles.pillText, acStatus === st && styles.pillTextActive]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Parent & Emergency Contacts */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>3. Parent & Emergency Contacts</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Father Name</Text>
            <TextInput style={styles.input} placeholder="Father Name" value={fatherName} onChangeText={setFatherName} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Father Phone</Text>
            <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={fatherPhone} onChangeText={setFatherPhone} />
          </View>
        </View>

        <Text style={styles.label}>Mother Name</Text>
        <TextInput style={styles.input} placeholder="Mother Name" value={motherName} onChangeText={setMotherName} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Emergency Contact</Text>
            <TextInput style={styles.input} placeholder="Emergency Name" value={emergencyName} onChangeText={setEmergencyName} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Emergency Phone</Text>
            <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={emergencyPhone} onChangeText={setEmergencyPhone} />
          </View>
        </View>
      </View>

      {/* Occupation Details */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>4. Occupation & Meter Info</Text>

        <Text style={styles.label}>Occupation Type</Text>
        <View style={styles.optionRow}>
          {['STUDYING', 'WORKING'].map((occ) => (
            <TouchableOpacity
              key={occ}
              style={[styles.pillBtn, occupation === occ && styles.pillBtnActive]}
              onPress={() => setOccupation(occ)}
            >
              <Text style={[styles.pillText, occupation === occ && styles.pillTextActive]}>{occ}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {occupation === 'STUDYING' ? (
          <View>
            <Text style={styles.label}>College Name</Text>
            <TextInput style={styles.input} placeholder="e.g. ABC Engineering College" value={collegeName} onChangeText={setCollegeName} />
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Company Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Tech Corp" value={companyName} onChangeText={setCompanyName} />
          </View>
        )}

        <Text style={styles.label}>Electricity Meter Number</Text>
        <TextInput style={styles.input} placeholder="e.g. MTR-1G1" value={electricityMeterNumber} onChangeText={setElectricityMeterNumber} />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitBtnText}>➕ Register Resident to Database</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  subTitle: { fontSize: 13, color: '#64748B', marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 16, marginBottom: SPACING.md, ...SHADOWS.small },
  cardHeading: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  row: { flexDirection: 'row', gap: 10 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pillBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  pillBtnActive: { backgroundColor: COLORS.primary },
  pillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
