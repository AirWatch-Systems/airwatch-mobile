import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PollutionPanel } from '../../src/components/PollutionPanel';
import { pollutionService, PollutionData } from '../../src/services/pollutionService';
import { showAlert } from '../../src/utils/alert';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [pollutionData, setPollutionData] = useState<PollutionData | null>(null);

  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permissão negada', 'Permissão de localização é necessária');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch {
      showAlert('Erro', 'Não foi possível obter a localização');
    }
  };

  const fetchPollutionData = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const current = await pollutionService.getCurrentPollution(location.latitude, location.longitude);
      setPollutionData(current);
      setShowPanel(true);
    } catch {
      showAlert('Erro', 'Não foi possível carregar os dados de poluição');
    } finally {
      setLoading(false);
    }
  };

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando localização...</Text>
      </View>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude-0.01},${location.latitude-0.01},${location.longitude+0.01},${location.latitude+0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`;

  return (
    <View style={styles.container}>
      <iframe
        src={mapUrl}
        style={styles.map}
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
      />

      <TouchableOpacity
        style={styles.pollutionButton}
        onPress={fetchPollutionData}
        disabled={loading}
      >
        <Ionicons name="analytics" size={24} color="white" />
        <Text style={styles.buttonText}>
          {loading ? 'Carregando...' : 'Ver Qualidade do Ar'}
        </Text>
      </TouchableOpacity>

      {showPanel && (
        <PollutionPanel
          data={pollutionData ? {
            aqi: pollutionData.aqi || 0,
            pm25: pollutionData.pollutants?.pM25 || 0,
            pm10: pollutionData.pollutants?.pM10 || 0,
            co: pollutionData.pollutants?.co || 0,
            no2: pollutionData.pollutants?.nO2 || 0,
            so2: pollutionData.pollutants?.sO2 || 0,
            o3: pollutionData.pollutants?.o3 || 0,
            lastUpdated: pollutionData.lastUpdated || new Date().toISOString(),
          } : null}

          onClose={() => setShowPanel(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollutionButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});