import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

export default function MapView({ style, initialRegion }: MapViewProps) {
  return (
    <View style={[styles.webMap, style]}>
      <Text style={styles.mapText}>
        Mapa Web - Localização: {initialRegion?.latitude.toFixed(4)}, {initialRegion?.longitude.toFixed(4)}
      </Text>
    </View>
  );
}

export function Marker({ coordinate, title }: MarkerProps) {
  return (
    <View style={styles.marker}>
      <Text style={styles.markerText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mapText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  marker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  markerText: {
    fontSize: 12,
    color: '#007AFF',
  },
});