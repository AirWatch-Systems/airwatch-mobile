import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationFilter {
  type: 'all' | 'current' | 'region';
  regionName?: string;
  coordinates?: { lat: number; lon: number };
}

interface Props {
  filter: LocationFilter;
  onFilterChange: (filter: LocationFilter) => void;
  hasCurrentLocation: boolean;
}

const predefinedRegions = [
  { name: 'São Paulo - Centro', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro - Copacabana', lat: -22.9711, lon: -43.1822 },
  { name: 'Brasília - Plano Piloto', lat: -15.7942, lon: -47.8822 },
  { name: 'Belo Horizonte - Centro', lat: -19.9167, lon: -43.9345 },
];

export function FeedbackFilters({ filter, onFilterChange, hasCurrentLocation }: Props) {
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');

  const handleRegionSelect = (region: typeof predefinedRegions[0]) => {
    onFilterChange({
      type: 'region',
      regionName: region.name,
      coordinates: { lat: region.lat, lon: region.lon }
    });
    setShowRegionModal(false);
  };

  const handleCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    
    if (isNaN(lat) || isNaN(lon)) return;
    
    onFilterChange({
      type: 'region',
      regionName: 'Localização personalizada',
      coordinates: { lat, lon }
    });
    setShowRegionModal(false);
    setCustomLat('');
    setCustomLon('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filtrar feedbacks por:</Text>
      
      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={[styles.filterButton, filter.type === 'all' && styles.filterButtonActive]}
          onPress={() => onFilterChange({ type: 'all' })}
        >
          <Text style={[styles.filterButtonText, filter.type === 'all' && styles.filterButtonTextActive]}>
            Meus
          </Text>
        </TouchableOpacity>
        
        {hasCurrentLocation && (
          <TouchableOpacity
            style={[styles.filterButton, filter.type === 'current' && styles.filterButtonActive]}
            onPress={() => onFilterChange({ type: 'current' })}
          >
            <Text style={[styles.filterButtonText, filter.type === 'current' && styles.filterButtonTextActive]}>
              Atual (5km)
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.filterButton, filter.type === 'region' && styles.filterButtonActive]}
          onPress={() => setShowRegionModal(true)}
        >
          <Text style={[styles.filterButtonText, filter.type === 'region' && styles.filterButtonTextActive]}>
            Região
          </Text>
        </TouchableOpacity>
      </View>

      {filter.type === 'region' && filter.regionName && (
        <View style={styles.selectedRegion}>
          <Ionicons name="location" size={16} color="#007AFF" />
          <Text style={styles.regionText}>{filter.regionName}</Text>
          <TouchableOpacity onPress={() => setShowRegionModal(true)}>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showRegionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Região</Text>
            <TouchableOpacity onPress={() => setShowRegionModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Regiões Predefinidas</Text>
          {predefinedRegions.map((region, index) => (
            <TouchableOpacity
              key={index}
              style={styles.regionOption}
              onPress={() => handleRegionSelect(region)}
            >
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <Text style={styles.regionOptionText}>{region.name}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Coordenadas Personalizadas</Text>
          <View style={styles.customLocationContainer}>
            <TextInput
              style={styles.coordinateInput}
              placeholder="Latitude (ex: -23.5505)"
              value={customLat}
              onChangeText={setCustomLat}
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={styles.coordinateInput}
              placeholder="Longitude (ex: -46.6333)"
              value={customLon}
              onChangeText={setCustomLon}
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity
              style={styles.customLocationButton}
              onPress={handleCustomLocation}
            >
              <Text style={styles.customLocationButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  selectedRegion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  regionText: {
    flex: 1,
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    margin: 16,
    marginBottom: 8,
    color: '#333',
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  customLocationContainer: {
    padding: 16,
  },
  coordinateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  customLocationButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});