import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { locationSearchService, LocationResult } from '../../src/services/locationSearchService';
import { pollutionService, PollutionData } from '../../src/services/pollutionService';
import { PollutionPanel } from '../../src/components/PollutionPanel';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pollutionData, setPollutionData] = useState<PollutionData | null>(null);

  const [showPanel, setShowPanel] = useState(false);


  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const locations = await locationSearchService.searchLocations(searchQuery);
      setResults(locations);
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar localizações');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = async (location: LocationResult) => {
    setResults([]);
    setQuery(location.address);
    
    setLoading(true);
    try {
      const current = await pollutionService.getCurrentPollution(location.latitude, location.longitude);
      setPollutionData(current);
      setShowPanel(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar dados de qualidade do ar');
    } finally {
      setLoading(false);
    }
  };

  const renderLocationItem = ({ item }: { item: LocationResult }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#007AFF" />
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationDetails}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar localização..."
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              handleSearch(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => {
              setQuery('');
              setResults([]);
            }}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderLocationItem}
        keyExtractor={(item, index) => item.placeId || `${item.latitude}-${item.longitude}-${index}`}
        style={styles.resultsList}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.length >= 3 && !loading && results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhuma localização encontrada</Text>
            </View>
          ) : null
        }
      />

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
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  resultsList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationDetails: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});