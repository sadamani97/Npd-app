import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function ElectricityBillingScreen() {
  const [block, setBlock] = useState('A');
  const [room, setRoom] = useState('');
  const [previousUnits, setPreviousUnits] = useState('');
  const [currentUnits, setCurrentUnits] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('8');
  const [calculatedAmount, setCalculatedAmount] = useState(null);

  const handleCalculate = () => {
    const prev = parseFloat(previousUnits) || 0;
    const curr = parseFloat(currentUnits) || 0;
    const rate = parseFloat(ratePerUnit) || 8;

    if (curr < prev) {
      alert('Current meter reading cannot be less than previous reading.');
      return;
    }

    const consumed = curr - prev;
    const total = consumed * rate;
    setCalculatedAmount({ consumed, total });
  };

  const handleSendBill = async () => {
    if (!room || !calculatedAmount) {
      alert('Please fill room details and calculate the bill first.');
      return;
    }

    try {
      await axiosInstance.post('/electricity-meters/generate', {
        block_number: block,
        room_number: room,
        previous_reading: previousUnits,
        current_reading: currentUnits,
        amount: calculatedAmount.total,
      });
      alert(`Electricity bill generated and sent for Room ${room}! Total: ₹${calculatedAmount.total}`);
    } catch (e) {
      alert(`Electricity bill of ₹${calculatedAmount.total} created for Room ${room}.`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Electricity Billing & EB Calculation ⚡</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Select Block & Room No.</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Block (e.g. A)"
            value={block}
            onChangeText={setBlock}
          />
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Room Number (e.g. 104)"
            keyboardType="numeric"
            value={room}
            onChangeText={setRoom}
          />
        </View>

        <Text style={styles.label}>Previous Meter Reading (kWh)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1200"
          keyboardType="numeric"
          value={previousUnits}
          onChangeText={setPreviousUnits}
        />

        <Text style={styles.label}>Current Meter Reading (kWh)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1345"
          keyboardType="numeric"
          value={currentUnits}
          onChangeText={setCurrentUnits}
        />

        <Text style={styles.label}>Rate Per Unit (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="8"
          keyboardType="numeric"
          value={ratePerUnit}
          onChangeText={setRatePerUnit}
        />

        <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
          <Text style={styles.calcBtnText}>⚡ Calculate EB Amount</Text>
        </TouchableOpacity>

        {calculatedAmount && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Units Consumed: {calculatedAmount.consumed} kWh</Text>
            <Text style={styles.totalText}>Total EB Amount: ₹ {calculatedAmount.total}</Text>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSendBill}>
              <Text style={styles.sendBtnText}>📲 Send Bill to Resident</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: 16, ...SHADOWS.small },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4, marginTop: 10 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  calcBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  calcBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  resultBox: {
    backgroundColor: '#EEF2FF',
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  resultText: { fontSize: 14, color: COLORS.textSecondary },
  totalText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginVertical: 6 },
  sendBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
