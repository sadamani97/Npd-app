import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axiosInstance from '../../api/axiosConfig';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';

export default function BlocksPage({ navigation, route }) {
  // Step navigation levels: 'BLOCK_LIST' -> 'FLOOR_LIST' -> 'ROOM_LIST' -> 'ROOM_DETAILS'
  const [level, setLevel] = useState('BLOCK_LIST');
  const [selectedBlock, setSelectedBlock] = useState('1');
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomDetails, setRoomDetails] = useState(null);

  useEffect(() => {
    if (route.params?.blockNumber) {
      handleSelectBlock(route.params.blockNumber);
    }
  }, [route.params]);

  const handleSelectBlock = async (blockNum) => {
    setSelectedBlock(blockNum);
    setLevel('FLOOR_LIST');
  };

  const handleSelectFloor = async (floorName) => {
    setSelectedFloor(floorName);
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/rooms/block/${selectedBlock}`);
      if (res.data && res.data.success) {
        setRooms(res.data.rooms || []);
      }
    } catch (e) {
      console.log('Error loading floor rooms', e);
    } finally {
      setLoading(false);
      setLevel('ROOM_LIST');
    }
  };

  const handleSelectRoom = async (roomItem) => {
    setSelectedRoom(roomItem);
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/rooms/${selectedBlock}/${roomItem.room_number}`);
      if (res.data && res.data.success) {
        setRoomDetails(res.data.room);
      } else {
        setRoomDetails(roomItem);
      }
    } catch (e) {
      setRoomDetails(roomItem);
    } finally {
      setLoading(false);
      setLevel('ROOM_DETAILS');
    }
  };

  // Helper to filter rooms by floor
  const filteredRooms = rooms.filter((r) => {
    const rNum = String(r.room_number || '');
    if (selectedFloor === 'Ground Floor') return rNum.includes('G') || rNum.startsWith('0');
    if (selectedFloor === 'First Floor') return rNum.includes('1F') || rNum.startsWith('1');
    if (selectedFloor === 'Second Floor') return rNum.includes('2F') || rNum.startsWith('2');
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1ST IMAGE VIEW: Block-wise Resident Distribution */}
      {level === 'BLOCK_LIST' && (
        <View>
          <Text style={styles.pageHeading}>📊 Block-wise Resident Distribution</Text>
          
          <View style={styles.blockRow}>
            {/* Block 1 */}
            <TouchableOpacity
              style={[styles.blockCard, styles.purpleBorder]}
              onPress={() => handleSelectBlock('1')}
            >
              <View style={styles.blockHeaderRow}>
                <Text style={styles.blockCardTitle}>Block 1</Text>
                <View style={styles.badgePurple}>
                  <Text style={styles.badgeTextPurple}>9 residents</Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { backgroundColor: '#8B5CF6', width: '90%' }]} />
              </View>
              <Text style={styles.occupancyText}>Occupancy: 90%</Text>
            </TouchableOpacity>

            {/* Block 2 */}
            <TouchableOpacity
              style={[styles.blockCard, styles.grayBorder]}
              onPress={() => handleSelectBlock('2')}
            >
              <View style={styles.blockHeaderRow}>
                <Text style={styles.blockCardTitle}>Block 2</Text>
                <View style={styles.badgeBlue}>
                  <Text style={styles.badgeTextBlue}>1 residents</Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { backgroundColor: '#3B82F6', width: '10%' }]} />
              </View>
              <Text style={styles.occupancyText}>Occupancy: 10%</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2ND IMAGE VIEW: Choose Floor (Block 1 / Block 2) */}
      {level === 'FLOOR_LIST' && (
        <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setLevel('BLOCK_LIST')}>
            <Text style={styles.backBtnText}>← Back to all blocks</Text>
          </TouchableOpacity>

          <Text style={styles.blockTitleHeader}>Block {selectedBlock}</Text>
          <Text style={styles.subHeader}>Choose a floor to view room numbers</Text>

          <View style={styles.floorRow}>
            <TouchableOpacity
              style={styles.floorCard}
              onPress={() => handleSelectFloor('Ground Floor')}
            >
              <Text style={styles.floorCardText}>Ground Floor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floorCard}
              onPress={() => handleSelectFloor('First Floor')}
            >
              <Text style={styles.floorCardText}>First Floor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floorCard}
              onPress={() => handleSelectFloor('Second Floor')}
            >
              <Text style={styles.floorCardText}>Second Floor</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3RD IMAGE VIEW: Room Grid (e.g. Ground Floor Rooms) */}
      {level === 'ROOM_LIST' && (
        <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setLevel('FLOOR_LIST')}>
            <Text style={styles.backBtnText}>← Back to floors (Block {selectedBlock})</Text>
          </TouchableOpacity>

          <Text style={styles.blockTitleHeader}>{selectedFloor}</Text>
          <Text style={styles.subHeader}>Block {selectedBlock} • {filteredRooms.length} room(s)</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.roomGrid}>
              {filteredRooms.length === 0 ? (
                // Fallback mock rooms if server returns empty list for demo
                ['1G1', '1G2', '1G3', '1G4', '1G5'].map((rNum) => (
                  <TouchableOpacity
                    key={rNum}
                    style={styles.roomGreenBtn}
                    onPress={() =>
                      handleSelectRoom({
                        room_number: rNum,
                        room_type: 'TRIPLE_SHARE',
                        ac_status: 'AC',
                        capacity: 3,
                        occupied: 0,
                        rent_amount: 10000,
                      })
                    }
                  >
                    <Text style={styles.roomGreenBtnText}>Room {rNum}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                filteredRooms.map((roomItem) => (
                  <TouchableOpacity
                    key={roomItem.id || roomItem.room_number}
                    style={styles.roomGreenBtn}
                    onPress={() => handleSelectRoom(roomItem)}
                  >
                    <Text style={styles.roomGreenBtnText}>Room {roomItem.room_number}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      )}

      {/* 4TH IMAGE VIEW: Room Details */}
      {level === 'ROOM_DETAILS' && (
        <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setLevel('ROOM_LIST')}>
            <Text style={styles.backBtnText}>← Back to rooms (Block {selectedBlock})</Text>
          </TouchableOpacity>

          <Text style={styles.blockTitleHeader}>
            Room {selectedRoom?.room_number} - Block {selectedBlock}
          </Text>

          <View style={styles.detailGrid}>
            {/* Left Card: Room Information */}
            <View style={[styles.detailCard, { flex: 1.5 }]}>
              <Text style={styles.cardSectionTitle}>Room Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Room Type:</Text>
                <Text style={styles.infoVal}>{selectedRoom?.room_type || 'TRIPLE SHARE'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>AC Status:</Text>
                <Text style={styles.infoVal}>{selectedRoom?.ac_status || 'AC'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Capacity:</Text>
                <Text style={styles.infoVal}>{selectedRoom?.capacity || 3}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Base Rent:</Text>
                <Text style={styles.infoVal}>₹{selectedRoom?.rent_amount || 10000}.00</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Status:</Text>
                <View style={styles.availableTag}>
                  <Text style={styles.availableTagText}>AVAILABLE</Text>
                </View>
              </View>
            </View>

            {/* Right Card: Current Occupancy */}
            <View style={[styles.detailCard, { flex: 1 }]}>
              <Text style={styles.cardSectionTitle}>Current Occupancy</Text>

              <View style={styles.occupancyBox}>
                <Text style={styles.occSub}>Current:</Text>
                <Text style={styles.occNum}>{selectedRoom?.occupied || 0}</Text>

                <Text style={styles.occSub}>Capacity:</Text>
                <Text style={styles.occNum}>{selectedRoom?.capacity || 3}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  pageHeading: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: SPACING.md },
  blockRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  blockCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    ...SHADOWS.small,
  },
  purpleBorder: { borderColor: '#8B5CF6' },
  grayBorder: { borderColor: '#E2E8F0' },
  blockHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  badgePurple: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextPurple: { color: '#8B5CF6', fontSize: 12, fontWeight: 'bold' },
  badgeBlue: { backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextBlue: { color: '#0EA5E9', fontSize: 12, fontWeight: 'bold' },
  barBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginVertical: 14, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  occupancyText: { fontSize: 12, color: '#64748B', textAlign: 'center' },

  backBtn: {
    backgroundColor: '#1E293B',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  backBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  blockTitleHeader: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  subHeader: { fontSize: 14, color: '#64748B', marginBottom: SPACING.lg, marginTop: 2 },
  floorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  floorCard: {
    flex: 1,
    minWidth: 160,
    height: 100,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  floorCardText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roomGreenBtn: {
    width: 140,
    height: 85,
    backgroundColor: '#10B981',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  roomGreenBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  detailGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: SPACING.md },
  detailCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: 16,
    minWidth: 260,
    ...SHADOWS.small,
  },
  cardSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoKey: { fontSize: 14, color: '#64748B' },
  infoVal: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  availableTag: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  availableTagText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  occupancyBox: { alignItems: 'center', marginTop: 10 },
  occSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  occNum: { fontSize: 26, fontWeight: 'bold', color: '#3B82F6' },
});
