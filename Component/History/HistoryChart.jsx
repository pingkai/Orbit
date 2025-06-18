import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTheme } from '@react-navigation/native';
import historyManager from '../../Utils/HistoryManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 120;
const BAR_WIDTH = (CHART_WIDTH - 60) / 7; // 7 days, with padding

export const HistoryChart = ({ weeklyStats }) => {
  const { colors, dark } = useTheme();
  const styles = getThemedStyles(colors, dark);

  // Days of the week
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate max value for scaling
  const maxValue = Math.max(...weeklyStats.dailyStats, 1);
  const maxHeight = CHART_HEIGHT - 40; // Leave space for labels

  // Format time for display
  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  };

  // Get total listening time for the week
  const totalWeekTime = weeklyStats.dailyStats.reduce((sum, time) => sum + time, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>This Week</Text>
        <Text style={[styles.totalTime, { color: colors.textSecondary }]}>
          {formatTime(totalWeekTime)} total
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <Line
              key={index}
              x1="30"
              y1={20 + (maxHeight * (1 - ratio))}
              x2={CHART_WIDTH - 10}
              y2={20 + (maxHeight * (1 - ratio))}
              stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="1"
            />
          ))}

          {/* Bars */}
          {weeklyStats.dailyStats.map((value, index) => {
            const barHeight = maxValue > 0 ? (value / maxValue) * maxHeight : 0;
            const x = 30 + (index * BAR_WIDTH) + (BAR_WIDTH * 0.1);
            const y = 20 + maxHeight - barHeight;
            const width = BAR_WIDTH * 0.8;

            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={width}
                height={barHeight}
                fill={colors.primary}
                rx="2"
                opacity={value > 0 ? 1 : 0.3}
              />
            );
          })}

          {/* Day labels */}
          {dayLabels.map((day, index) => (
            <SvgText
              key={index}
              x={30 + (index * BAR_WIDTH) + (BAR_WIDTH * 0.5)}
              y={CHART_HEIGHT - 5}
              fontSize="12"
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {day}
            </SvgText>
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((ratio, index) => {
            const value = maxValue * ratio;
            const timeLabel = formatTime(value);
            return (
              <SvgText
                key={index}
                x="25"
                y={25 + (maxHeight * (1 - ratio))}
                fontSize="10"
                fill={colors.textSecondary}
                textAnchor="end"
              >
                {timeLabel}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {weeklyStats.songsPlayed}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Songs
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round(totalWeekTime / (1000 * 60 * 60 * 24 * 7) * 100) / 100}h
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Daily Avg
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {weeklyStats.dailyStats.filter(time => time > 0).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Active Days
          </Text>
        </View>
      </View>
    </View>
  );
};

const getThemedStyles = (colors, dark) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
