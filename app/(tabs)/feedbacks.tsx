import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { feedbackService } from '../../src/services/feedbackService';
import { FeedbackItemDto } from '../../src/types/feedback';
import { FeedbackFilters } from '../../src/components/FeedbackFilters';
import { CreateFeedbackModal } from '../../src/components/CreateFeedbackModal';

interface LocationFilter {
  type: 'all' | 'current' | 'region';
  regionName?: string;
  coordinates?: { lat: number; lon: number };
}

export default function FeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<LocationFilter>({ type: 'all' });
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    loadFeedbacks();
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        lat: location.coords.latitude,
        lon: location.coords.longitude
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      let feedbackData: FeedbackItemDto[] = [];
      
      if (filter.type === 'all') {
        feedbackData = await feedbackService.getMyFeedbacks();
      } else if (filter.type === 'current' && currentLocation) {
        feedbackData = await feedbackService.getFeedbacksNearLocation(
          currentLocation.lat,
          currentLocation.lon,
          5,
          168
        );
      } else if (filter.type === 'region' && filter.coordinates) {
        feedbackData = await feedbackService.getFeedbacksNearLocation(
          filter.coordinates.lat,
          filter.coordinates.lon,
          10,
          168
        );
      }

      setFeedbacks(feedbackData);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#4CAF50';
    if (rating >= 3) return '#FF9800';
    return '#F44336';
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 5: return 'Boa';
      case 4: return 'Normal';
      case 3: return 'Ruim';
      case 2: return 'Muito Ruim';
      case 1: return 'Péssima';
      default: return 'N/A';
    }
  };

  const renderFeedback = ({ item }: { item: FeedbackItemDto }) => (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
          <Text style={styles.ratingText}>{getRatingText(item.rating)}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      
      {item.comment && (
        <Text style={styles.commentText}>{item.comment}</Text>
      )}
      
      <View style={styles.locationInfo}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.coordinatesText}>
          {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FeedbackFilters
        filter={filter}
        onFilterChange={setFilter}
        hasCurrentLocation={currentLocation !== null}
      />

      <FlatList
        data={feedbacks}
        renderItem={renderFeedback}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadFeedbacks}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum feedback encontrado</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCreateModal(true)}
        disabled={!currentLocation}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <CreateFeedbackModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentLocation={currentLocation}
        onSuccess={() => {
          setShowCreateModal(false);
          loadFeedbacks();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  listContainer: {
    padding: 16,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordinatesText: {
    marginLeft: 4,
    fontSize: 12,
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
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});