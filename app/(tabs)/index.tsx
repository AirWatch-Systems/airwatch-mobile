import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Platform } from 'react-native';
import MapView, { Marker } from '../../src/components/MapView';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PollutionPanel } from '../../src/components/PollutionPanel';
import { pollutionService, PollutionData, HistoryPoint } from '../../src/services/pollutionService';
import { showAlert } from '../../src/utils/alert';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [pollutionData, setPollutionData] = useState<PollutionData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          showAlert('Permissão negada', 'Permissão de localização é necessária');
        } else {
          Alert.alert('Permissão negada', 'Permissão de localização é necessária');
        }
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch {
      if (Platform.OS === 'web') {
        showAlert('Erro', 'Não foi possível obter a localização');
      } else {
        Alert.alert('Erro', 'Não foi possível obter a localização');
      }
    }
  };

  const fetchPollutionData = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const [current, history] = await Promise.all([
        pollutionService.getCurrentPollution(location.latitude, location.longitude),
        pollutionService.getPollutionHistory(location.latitude, location.longitude, 24)
      ]);

      setPollutionData(current);
      setHistoryData(history.points);
      setShowPanel(true);
    } catch {
      if (Platform.OS === 'web') {
        showAlert('Erro', 'Não foi possível carregar os dados de poluição');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os dados de poluição');
      }
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={location}
          title="Sua localização"
          description="Toque no botão para ver dados de qualidade do ar"
        />
      </MapView>

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
          history={historyData}
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
  },
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