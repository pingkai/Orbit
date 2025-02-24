import React, { useState, useEffect, useRef } from 'react';
import { Pressable, Modal, View, Text, StyleSheet, TextInput } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PlaySong, PauseSong } from '../../MusicPlayerFunctions'; 

export const SleepTimerButton = ({ size = 25 }) => {
  const [isTimerActive, setIsTimerActive] = useState(false); 
  const [modalVisible, setModalVisible] = useState(false); 
  const [customTime, setCustomTime] = useState(''); 
  const [timeUnit, setTimeUnit] = useState('minutes'); 
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef(null); 
  const countdownRef = useRef(null); 
  const timerOptions = [
    { label: '15 minutes', value: 15 * 60 },
    { label: '30 minutes', value: 30 * 60 },
    { label: '45 minutes', value: 45 * 60 },
    { label: '1 hour', value: 60 * 60 },
  ];
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsTimerActive(false);
    setRemainingTime(0);
  };
  const setSleepTimer = (seconds) => {
    clearTimer();
    PlaySong(); // Start playback when the timer is set
    setRemainingTime(seconds);
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          PauseSong(); // Pause playback when countdown reaches zero
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = setTimeout(() => {
      PauseSong(); // Ensure playback stops after the specified duration
      clearTimer();
    }, seconds * 1000);
    setIsTimerActive(true);
    setModalVisible(false);
    setCustomTime('');
  };
  const handleCustomTimer = () => {
    const time = parseInt(customTime, 10);
    if (!isNaN(time) && time > 0) {
      const seconds = timeUnit === 'hours' ? time * 3600 : time * 60;
      setSleepTimer(seconds);
    }
  };
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => (isTimerActive ? clearTimer() : setModalVisible(true))}
        style={styles.button}
      >
        <MaterialCommunityIcons
          name={isTimerActive ? 'timer' : 'timer-outline'}
          size={size}
          color={isTimerActive ? '#1DB954' : 'white'}
        />
        {isTimerActive && (
          <Text style={styles.remainingTime}>
            {formatTime(remainingTime)}
          </Text>
        )}
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Sleep Timer</Text>

            {timerOptions.map((option) => (
              <Pressable
                key={option.value}
                style={styles.timerOption}
                onPress={() => setSleepTimer(option.value)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}

            <View style={styles.customTimerContainer}>
              <View style={styles.customTimerRow}>
                <TextInput
                  style={styles.customTimerInput}
                  placeholder={`Enter ${timeUnit}`}
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  value={customTime}
                  onChangeText={setCustomTime}
                />
                <View style={styles.unitSelector}>
                  <Pressable
                    style={[
                      styles.unitButton,
                      timeUnit === 'minutes' && styles.unitButtonActive,
                    ]}
                    onPress={() => setTimeUnit('minutes')}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        timeUnit === 'minutes' && styles.unitButtonTextActive,
                      ]}
                    >
                      Min
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.unitButton,
                      timeUnit === 'hours' && styles.unitButtonActive,
                    ]}
                    onPress={() => setTimeUnit('hours')}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        timeUnit === 'hours' && styles.unitButtonTextActive,
                      ]}
                    >
                      Hour
                    </Text>
                  </Pressable>
                </View>
              </View>
              <Pressable
                style={[styles.timerOption, styles.customTimerButton]}
                onPress={handleCustomTimer}
              >
                <Text style={styles.optionText}>Set Custom Timer</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setCustomTime('');
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 15,
  },
  button: {
    alignItems: 'center',
  },
  remainingTime: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#282828',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  customTimerContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 15,
  },
  customTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customTimerInput: {
    flex: 1,
    backgroundColor: '#363636',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
    marginRight: 10,
  },
  customTimerButton: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    marginTop: 5,
    borderBottomWidth: 0,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#363636',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  unitButtonActive: {
    backgroundColor: '#1DB954',
  },
  unitButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unitButtonTextActive: {
    color: 'white',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 15,
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default SleepTimerButton;