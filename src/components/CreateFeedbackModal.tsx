import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedbackService } from '../services/feedbackService';
import { RatingLabel, ratingLabelToValue } from '../types/feedback';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentLocation: { lat: number; lon: number } | null;
  onSuccess: () => void;
}

const ratingOptions: RatingLabel[] = ['Péssima', 'Muito Ruim', 'Ruim', 'Normal', 'Boa'];

export function CreateFeedbackModal({ visible, onClose, currentLocation, onSuccess }: Props) {
  const [selectedRating, setSelectedRating] = useState<RatingLabel>('Normal');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentLocation) {
      Alert.alert('Erro', 'Localização não disponível');
      return;
    }

    setLoading(true);
    try {
      await feedbackService.createFeedback({
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        rating: ratingLabelToValue(selectedRating),
        comment: comment.trim() || undefined
      });

      Alert.alert('Sucesso', 'Feedback enviado com sucesso!');
      setComment('');
      setSelectedRating('Normal');
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao enviar feedback';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: RatingLabel) => {
    const value = ratingLabelToValue(rating);
    if (value >= 4) return '#4CAF50';
    if (value >= 3) return '#FF9800';
    return '#F44336';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Novo Feedback</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Como está a qualidade do ar?</Text>
          
          <View style={styles.ratingContainer}>
            {ratingOptions.map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingOption,
                  selectedRating === rating && { backgroundColor: getRatingColor(rating) }
                ]}
                onPress={() => setSelectedRating(rating)}
              >
                <Text style={[
                  styles.ratingText,
                  selectedRating === rating && { color: '#fff' }
                ]}>
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Comentário (opcional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Descreva sua experiência..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          {currentLocation && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color="#007AFF" />
              <Text style={styles.locationText}>
                {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !currentLocation}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Enviando...' : 'Enviar Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});