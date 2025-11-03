import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PollutionData {
  aqi: number;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
  lastUpdated: string;
}

interface HistoryPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
}

interface PollutionPanelProps {
  data: PollutionData | null;
  history: HistoryPoint[];
  onClose: () => void;
}

export function PollutionPanel({ data, history, onClose }: PollutionPanelProps) {
  if (!data) return null;

  const getAQIColor = (aqi: number) => {
    switch (aqi) {
      case 1:
        return '#00e400';
      case 2:
        return '#ebc802';
      case 3:
        return '#ff9933';
      case 4:
        return '#ff3333';
      default:
        return '#660033';
    }
  };

  const getAQILabel = (aqi: number) => {
    switch (aqi) {
      case 1:
        return 'Bom';
      case 2:
        return 'Moderado';
      case 3:
        return 'Insalubre para grupos sensíveis';
      case 4:
        return 'Insalubre';
      case 5:
        return 'Muito insalubre';
      default:
        return 'Perigoso';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Qualidade do Ar</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.aqiCard, { backgroundColor: getAQIColor(data.aqi || 0) }]}>
            <Text style={styles.aqiValue}>{data.aqi || 0}</Text>
            <Text style={styles.aqiLabel}>{getAQILabel(data.aqi || 0)}</Text>
          </View>

          <View style={styles.pollutantsGrid}>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>PM2.5</Text>
              <Text style={styles.pollutantValue}>{(data.pm25 || 0).toFixed(1)} μg/m³</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>PM10</Text>
              <Text style={styles.pollutantValue}>{(data.pm10 || 0).toFixed(1)} μg/m³</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>CO</Text>
              <Text style={styles.pollutantValue}>{(data.co || 0).toFixed(1)} μg/m³</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>NO₂</Text>
              <Text style={styles.pollutantValue}>{(data.no2 || 0).toFixed(1)} μg/m³</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>SO₂</Text>
              <Text style={styles.pollutantValue}>{(data.so2 || 0).toFixed(1)} μg/m³</Text>
            </View>
            <View style={styles.pollutantItem}>
              <Text style={styles.pollutantLabel}>O₃</Text>
              <Text style={styles.pollutantValue}>{(data.o3 || 0).toFixed(1)} μg/m³</Text>
            </View>
          </View>

          {history.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Variação AQI (24h)</Text>
              <View style={styles.simpleChart}>
                {history.slice(-12).map((point, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { 
                          height: `${Math.min(((point.aqi || 0) / 300) * 100, 100)}%`,
                          backgroundColor: getAQIColor(point.aqi || 0)
                        }
                      ]} 
                    />
                    <Text style={styles.chartLabel}>
                      {new Date(point.timestamp).getHours()}h
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.lastUpdated}>
            Última atualização: {new Date(data.lastUpdated).toLocaleString('pt-BR')}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
  },
  aqiCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  aqiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  aqiLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pollutantItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  pollutantLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  pollutantValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  simpleChart: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  chartBar: {
    flex: 1,
    height: 100,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 5,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});