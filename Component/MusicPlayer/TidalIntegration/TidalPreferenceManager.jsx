import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTidalIntegration } from './useTidalIntegration';
import { useThemeManager } from '../ThemeManager/useThemeManager';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * TidalPreferenceManager - Component for managing Tidal integration preferences
 * 
 * This component provides UI for managing Tidal-related settings including:
 * - Enable/disable Tidal integration
 * - Tidal quality preferences
 * - Source priority settings
 * - Integration status display
 */

export const TidalPreferenceManager = ({ 
  style,
  showAsModal = false,
  visible = false,
  onClose = null
}) => {
  const { 
    tidalEnabled, 
    isLoading,
    toggleTidalIntegration,
    getTidalStatus,
    getAvailableSources
  } = useTidalIntegration();
  
  const { 
    getTextColor, 
    getBackgroundOverlay,
    getButtonBackgroundColor,
    themeMode 
  } = useThemeManager();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleTidal = async () => {
    await toggleTidalIntegration();
  };

  const renderContent = () => (
    <ScrollView style={styles.container}>
      {/* Main Tidal Toggle */}
      <View style={[
        styles.section,
        { backgroundColor: getButtonBackgroundColor(0.05) }
      ]}>
        <View style={styles.sectionHeader}>
          <Ionicons 
            name="musical-notes" 
            size={24} 
            color={getTextColor('primary')} 
          />
          <Text style={[
            styles.sectionTitle,
            { color: getTextColor('primary') }
          ]}>
            Tidal Integration
          </Text>
        </View>
        
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={[
              styles.preferenceTitle,
              { color: getTextColor('primary') }
            ]}>
              Enable Tidal
            </Text>
            <Text style={[
              styles.preferenceDescription,
              { color: getTextColor('secondary') }
            ]}>
              Access high-quality music from Tidal
            </Text>
          </View>
          <Switch
            value={tidalEnabled}
            onValueChange={handleToggleTidal}
            disabled={isLoading}
            trackColor={{ 
              false: getTextColor('secondary'), 
              true: getTextColor('primary') 
            }}
            thumbColor={tidalEnabled ? '#4CAF50' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Status Section */}
      <View style={[
        styles.section,
        { backgroundColor: getButtonBackgroundColor(0.05) }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: getTextColor('primary') }
        ]}>
          Integration Status
        </Text>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[
              styles.statusLabel,
              { color: getTextColor('secondary') }
            ]}>
              Status
            </Text>
            <Text style={[
              styles.statusValue,
              { color: tidalEnabled ? '#4CAF50' : getTextColor('secondary') }
            ]}>
              {isLoading ? 'Loading...' : (tidalEnabled ? 'Enabled' : 'Disabled')}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[
              styles.statusLabel,
              { color: getTextColor('secondary') }
            ]}>
              Available Sources
            </Text>
            <Text style={[
              styles.statusValue,
              { color: getTextColor('primary') }
            ]}>
              {getAvailableSources().join(', ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Advanced Settings */}
      {tidalEnabled && (
        <View style={[
          styles.section,
          { backgroundColor: getButtonBackgroundColor(0.05) }
        ]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Ionicons 
              name="settings" 
              size={20} 
              color={getTextColor('primary')} 
            />
            <Text style={[
              styles.sectionTitle,
              { color: getTextColor('primary') }
            ]}>
              Advanced Settings
            </Text>
            <Ionicons 
              name={showAdvanced ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={getTextColor('secondary')} 
            />
          </TouchableOpacity>
          
          {showAdvanced && (
            <View style={styles.advancedContent}>
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <Text style={[
                    styles.preferenceTitle,
                    { color: getTextColor('primary') }
                  ]}>
                    Auto Source Switching
                  </Text>
                  <Text style={[
                    styles.preferenceDescription,
                    { color: getTextColor('secondary') }
                  ]}>
                    Coming in future updates
                  </Text>
                </View>
                <Switch
                  value={false}
                  disabled={true}
                  trackColor={{ false: getTextColor('secondary'), true: '#4CAF50' }}
                  thumbColor={'#f4f3f4'}
                />
              </View>
              
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceInfo}>
                  <Text style={[
                    styles.preferenceTitle,
                    { color: getTextColor('primary') }
                  ]}>
                    Quality Preference
                  </Text>
                  <Text style={[
                    styles.preferenceDescription,
                    { color: getTextColor('secondary') }
                  ]}>
                    Lossless (when available)
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Information Section */}
      <View style={[
        styles.section,
        { backgroundColor: getButtonBackgroundColor(0.05) }
      ]}>
        <View style={styles.sectionHeader}>
          <Ionicons 
            name="information-circle" 
            size={20} 
            color={getTextColor('secondary')} 
          />
          <Text style={[
            styles.sectionTitle,
            { color: getTextColor('secondary') }
          ]}>
            About Tidal Integration
          </Text>
        </View>
        
        <Text style={[
          styles.infoText,
          { color: getTextColor('secondary') }
        ]}>
          Tidal integration provides access to high-quality music streaming. 
          Source switching and advanced features will be available in future updates.
        </Text>
      </View>
    </ScrollView>
  );

  if (showAsModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[
          styles.modalContainer,
          { backgroundColor: getBackgroundOverlay() }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={[
              styles.modalTitle,
              { color: getTextColor('primary') }
            ]}>
              Tidal Settings
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons 
                name="close" 
                size={24} 
                color={getTextColor('primary')} 
              />
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </Modal>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  statusGrid: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  advancedContent: {
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
