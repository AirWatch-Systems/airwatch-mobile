import React, { useMemo, useState } from "react";
import { Redirect } from "expo-router";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import CrossPlatformMapView, {
  type Region,
} from "../../src/components/Map/MapView";

import { useAuthContext } from "../../src/hooks/AuthContext";
import {
  useLocationPermission,
  useCurrentLocation,
  useFeedbacks,
  useSubmitFeedback,
  useMarkers,
  useSearchLocations,
} from "../../src/hooks/useLocation";
import { usePollution } from "../../src/hooks/usePollution";
import { ratingLabelToValue, humanizeError, type RatingLabel } from "../../src/hooks/types";

import {
  ErrorToast,
  LoadingOverlay,
  PollutionCards,
  PollutionLineChart,
} from "../../src/components/common";

export default function Index() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthContext();

  // Location (RF03)
  const {
    hasPermission,
    requestPermission,
    status: locationStatus,
    isRequesting: isRequestingLoc,
    error: locationError,
  } = useLocationPermission();
  const {
    coords,
    regionName,
    isLoading: isLoadingLocation,
    error: currentLocError,
    refetch: refetchLocation,
  } = useCurrentLocation(hasPermission);

  // Pollution (RF04, RF14) - only if authenticated
  const {
    current,
    history,
    isLoadingCurrent,
    isLoadingHistory,
    errorCurrent,
    errorHistory,
    refetchCurrent,
    refetchHistory,
  } = usePollution({
    lat: isAuthenticated ? coords?.lat : null,
    lon: isAuthenticated ? coords?.lon : null,
    hours: 24,
    autoRefresh: true,
  });

  // Feedbacks (RF05, RF06) - only if authenticated
  const {
    items: feedbacks,
    isLoading: isLoadingFeedbacks,
    error: feedbacksError,
    refetch: refetchFeedbacks,
  } = useFeedbacks(
    isAuthenticated && coords ? { lat: coords.lat, lon: coords.lon, radius: 5, hours: 12 } : null,
  );
  const { submit, isSubmitting, error: submitError } = useSubmitFeedback();
  const [ratingLabel, setRatingLabel] = useState<RatingLabel | null>(null);
  const [comment, setComment] = useState("");

  // Map markers and search (RF07, RF08) - only if authenticated
  const {
    markers,
    isLoading: isLoadingMarkers,
    error: markersError,
    fetchMarkers,
  } = useMarkers();

  const [mapRegion, setMapRegion] = useState<Region | null>(
    coords
      ? {
          latitude: Number(coords.lat),
          longitude: Number(coords.lon),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : null,
  );
  const onRegionChangeComplete = (region: Region) => {
    setMapRegion(region);
    if (isAuthenticated) {
      const lat1 = region.latitude - region.latitudeDelta / 2;
      const lat2 = region.latitude + region.latitudeDelta / 2;
      const lon1 = region.longitude - region.longitudeDelta / 2;
      const lon2 = region.longitude + region.longitudeDelta / 2;
      fetchMarkers({
        lat1: Number(lat1.toFixed(6)),
        lon1: Number(lon1.toFixed(6)),
        lat2: Number(lat2.toFixed(6)),
        lon2: Number(lon2.toFixed(6)),
      });
    }
  };
  const getMarkerColor = (avgAqi: number) => {
    if (avgAqi <= 50) return "#16a34a";
    if (avgAqi <= 100) return "#65a30d";
    if (avgAqi <= 150) return "#ca8a04";
    if (avgAqi <= 200) return "#d97706";
    if (avgAqi <= 300) return "#dc2626";
    return "#7f1d1d";
  };

  const {
    results: searchResults,
    isSearching,
    error: searchError,
    search,
  } = useSearchLocations();
  const [searchQuery, setSearchQuery] = useState("");

  // Panel state
  const [showPanel, setShowPanel] = useState(false);

  const anyLoading =
    isRequestingLoc ||
    isLoadingLocation ||
    isLoadingCurrent ||
    isLoadingHistory ||
    isSubmitting ||
    isLoadingMarkers ||
    isSearching;

  const errorMessage = useMemo(() => {
    return (
      humanizeError(locationError) ||
      humanizeError(currentLocError) ||
      humanizeError(errorCurrent) ||
      humanizeError(errorHistory) ||
      humanizeError(feedbacksError) ||
      humanizeError(submitError) ||
      humanizeError(markersError) ||
      humanizeError(searchError)
    );
  }, [
    locationError,
    currentLocError,
    errorCurrent,
    errorHistory,
    feedbacksError,
    submitError,
    markersError,
    searchError,
  ]);

  const onSubmitFeedback = async () => {
    if (!isAuthenticated || !coords || !ratingLabel) return;
    await submit({
      lat: coords.lat,
      lon: coords.lon,
      rating: ratingLabelToValue(ratingLabel),
      comment: comment?.trim() || undefined,
    });
    setRatingLabel(null);
    setComment("");
    refetchFeedbacks();
  };

  const canShowData = Boolean(coords);

  // Redirect if not authenticated - must be after all hooks
  if (!isAuthenticated && !isLoading) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={anyLoading} message="Carregando..." />
      <ErrorToast
        visible={Boolean(errorMessage)}
        message={errorMessage || ""}
        type="error"
        onDismiss={() => {
          /* auto-dismiss */
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {/* Location & Permission (RF03) */}
        <View style={styles.card}>
          <View className="sectionHeader" style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color="#ffd33d" />
            <Text style={styles.sectionTitle}>Localização atual</Text>
          </View>

          {!hasPermission ? (
            <View style={styles.row}>
              <Text style={styles.muted}>
                Permissão de localização: {locationStatus ?? "desconhecida"}
              </Text>
              <Pressable style={styles.button} onPress={requestPermission}>
                <Text style={styles.buttonText}>Permitir</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.rowWrap}>
              <Text style={styles.primary}>
                {regionName || "Obtendo região..."}
              </Text>
              <Text style={styles.smallMuted}>
                {coords
                  ? `(${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)})`
                  : "Sem coordenadas"}
              </Text>
              <Pressable style={styles.ghostButton} onPress={refetchLocation}>
                <Ionicons name="refresh" size={14} color="#fff" />
                <Text style={styles.ghostButtonText}>
                  Atualizar localização
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Map and Markers (RF07, RF08) */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={18} color="#ffd33d" />
            <Text style={styles.sectionTitle}>Mapa e Marcadores</Text>
            <Pressable
              style={styles.ghostButton}
              onPress={() => setShowPanel(true)}
            >
              <Ionicons name="stats-chart" size={14} color="#fff" />
              <Text style={styles.ghostButtonText}>Painel</Text>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Buscar cidade ou região"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable
                style={styles.ghostButton}
                onPress={() => {
                  const q = searchQuery.trim();
                  if (q.length >= 2) search(q);
                }}
              >
                <Ionicons name="search" size={14} color="#fff" />
                <Text style={styles.ghostButtonText}>Buscar</Text>
              </Pressable>
            </View>

            {isSearching ? (
              <View style={styles.centerRow}>
                <ActivityIndicator color="#ffd33d" />
                <Text style={styles.muted}>Buscando...</Text>
              </View>
            ) : null}

            {searchResults.length > 0 && (
              <View style={{ gap: 6 }}>
                {searchResults.slice(0, 5).map((r) => (
                  <Pressable
                    key={r.placeId || r.name}
                    style={styles.ghostButton}
                    onPress={() => {
                      setMapRegion({
                        latitude: Number(r.lat),
                        longitude: Number(r.lon),
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      });
                    }}
                  >
                    <Ionicons name="location" size={14} color="#fff" />
                    <Text style={styles.ghostButtonText}>{r.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {mapRegion ? (
              <CrossPlatformMapView
                style={{
                  width: "100%",
                  height: 400,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
                region={mapRegion}
                onRegionChangeComplete={onRegionChangeComplete}
                markers={markers.map((m, idx) => ({
                  id: `${m.lat}-${m.lon}-${idx}`,
                  lat: Number(m.lat),
                  lon: Number(m.lon),
                  title: `AQI médio: ${Math.round(m.avgAqi)}`,
                  description: `Feedbacks: ${m.feedbackCount}`,
                  color: getMarkerColor(m.avgAqi),
                }))}
              />
            ) : (
              <View
                style={{
                  height: 400,
                  backgroundColor: "#0b1220",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={styles.muted}>
                  Obtenha sua localização para carregar o mapa.
                </Text>
              </View>
            )}
          </View>
        </View>


        {/* Panel Modal */}
        {showPanel && (
          <View style={styles.panelOverlay}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Painel de Qualidade do Ar</Text>
                <Pressable onPress={() => setShowPanel(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>
              </View>

              <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
                {/* Pollution Dashboard (RF04, RF14) */}
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="speedometer-outline" size={18} color="#ffd33d" />
                    <Text style={styles.sectionTitle}>Qualidade do Ar (agora)</Text>
                    <Pressable style={styles.ghostButton} onPress={refetchCurrent}>
                      <Ionicons name="refresh" size={14} color="#fff" />
                      <Text style={styles.ghostButtonText}>Atualizar</Text>
                    </Pressable>
                  </View>
                  {isLoadingCurrent && !current ? (
                    <View style={styles.centerRow}>
                      <ActivityIndicator color="#ffd33d" />
                      <Text style={styles.muted}>Carregando...</Text>
                    </View>
                  ) : (
                    <PollutionCards current={canShowData ? (current ?? null) : null} />
                  )}
                </View>

                {/* Pollution History Chart (RF04) */}
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="analytics-outline" size={18} color="#ffd33d" />
                    <Text style={styles.sectionTitle}>Últimas 24h</Text>
                    <Pressable style={styles.ghostButton} onPress={refetchHistory}>
                      <Ionicons name="refresh" size={14} color="#fff" />
                      <Text style={styles.ghostButtonText}>Atualizar</Text>
                    </Pressable>
                  </View>
                  {isLoadingHistory && !history ? (
                    <View style={styles.centerRow}>
                      <ActivityIndicator color="#ffd33d" />
                      <Text style={styles.muted}>Carregando...</Text>
                    </View>
                  ) : (
                    <PollutionLineChart
                      data={canShowData ? (history ?? []) : []}
                      height={240}
                      color="#60a5fa"
                      showLegend={Platform.OS === "web"}
                      showGrid
                    />
                  )}
                </View>

                {/* Feedbacks (RF05) */}
                <View style={styles.card}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubbles-outline" size={18} color="#ffd33d" />
                    <Text style={styles.sectionTitle}>Feedbacks recentes</Text>
                    <Pressable style={styles.ghostButton} onPress={refetchFeedbacks}>
                      <Ionicons name="refresh" size={14} color="#fff" />
                      <Text style={styles.ghostButtonText}>Atualizar</Text>
                    </Pressable>
                  </View>
                  {isLoadingFeedbacks ? (
                    <View style={styles.centerRow}>
                      <ActivityIndicator color="#ffd33d" />
                      <Text style={styles.muted}>Carregando...</Text>
                    </View>
                  ) : feedbacks && feedbacks.length > 0 ? (
                    feedbacks.slice(0, 6).map((f) => (
                      <View key={f.id} style={styles.feedbackItem}>
                        <Ionicons
                          name="person-circle"
                          size={20}
                          color="#9ca3af"
                          style={{ marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.feedbackUser}>
                            {f.user?.name || "Usuário"}
                          </Text>
                          <Text style={styles.feedbackComment}>
                            {f.comment || "(sem comentário)"}
                          </Text>
                        </View>
                        <View style={styles.ratingPill}>
                          <Text style={styles.ratingText}>{f.rating}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.muted}>Sem feedbacks na região.</Text>
                  )}
                </View>

                {/* Submit Feedback (RF06) */}
                {canShowData && isAuthenticated ? (
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="create-outline" size={18} color="#ffd33d" />
                      <Text style={styles.sectionTitle}>Avaliar qualidade do ar</Text>
                    </View>

                    <View style={styles.ratingRow}>
                      {(
                        [
                          "Boa",
                          "Normal",
                          "Ruim",
                          "Muito Ruim",
                          "Péssima",
                        ] as RatingLabel[]
                      ).map((label) => {
                        const active = ratingLabel === label;
                        return (
                          <Pressable
                            key={label}
                            onPress={() => setRatingLabel(label)}
                            style={[styles.pill, active && styles.pillActive]}
                          >
                            <Text
                              style={[styles.pillText, active && styles.pillTextActive]}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <TextInput
                      placeholder="Comentário (opcional)"
                      placeholderTextColor="#9ca3af"
                      value={comment}
                      onChangeText={setComment}
                      style={[styles.input, { minHeight: 44 }]}
                      maxLength={500}
                      multiline
                    />

                    <Pressable
                      style={[styles.button, !ratingLabel && styles.buttonDisabled]}
                      onPress={onSubmitFeedback}
                      disabled={!ratingLabel || isSubmitting}
                    >
                      <Text style={styles.buttonText}>Enviar feedback</Text>
                    </Pressable>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Footnote */}
        <Text style={styles.footnote}>
          Dica: abra a aba {"About"} para ver mais informações.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowWrap: {
    gap: 6,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e5e7eb",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#ffd33d",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#111827",
    fontWeight: "800",
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  ghostButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  muted: {
    color: "#9ca3af",
  },
  primary: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  smallMuted: {
    color: "#9ca3af",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginVertical: 10,
  },
  feedbackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  feedbackUser: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  feedbackComment: {
    color: "#9ca3af",
    fontSize: 12,
  },
  ratingPill: {
    marginLeft: 8,
    backgroundColor: "#374151",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ratingText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: "#ffd33d",
    borderColor: "#ffd33d",
  },
  pillText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#111827",
    fontWeight: "800",
  },
  footnote: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 8,
    fontSize: 12,
  },
  panelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  panel: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#25292e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  panelTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  panelContent: {
    padding: 16,
    maxHeight: 500,
  },
});
