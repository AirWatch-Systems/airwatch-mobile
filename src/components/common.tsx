import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// Tipos locais
interface PollutantsDto {
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
}

interface PollutionCurrentResponse {
  aqi: number;
  pollutants: PollutantsDto;
}

// -------------------------------
// ErrorToast
// -------------------------------
export type ToastType = "error" | "success" | "info" | "warning";

interface ErrorToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  durationMs?: number; // auto-dismiss after duration (default 3500)
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  visible,
  message,
  type = "error",
  onDismiss,
  durationMs = 3500,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = useMemo(() => {
    switch (type) {
      case "success":
        return { bg: "#0f766e", icon: "checkmark-circle" as const };
      case "info":
        return { bg: "#1e3a8a", icon: "information-circle" as const };
      case "warning":
        return { bg: "#92400e", icon: "warning" as const };
      case "error":
      default:
        return { bg: "#7f1d1d", icon: "alert-circle" as const };
    }
  }, [type]);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (durationMs > 0) {
        timerRef.current = setTimeout(() => {
          handleDismiss();
        }, durationMs);
      }
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, durationMs]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { transform: [{ translateY }], opacity, backgroundColor: colors.bg },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons
          name={colors.icon}
          size={20}
          color="#fff"
          style={styles.toastIcon}
        />
        <Text style={styles.toastText} numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          style={styles.toastClose}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

// -------------------------------
// LoadingOverlay
// -------------------------------
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
}) => {
  if (!visible) return null;
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlayBackdrop}>
        <View style={styles.overlayCard}>
          <ActivityIndicator size="large" color="#ffd33d" />
          {!!message && <Text style={styles.overlayText}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

// -------------------------------
// PollutionCards
// -------------------------------
interface PollutionCardsProps {
  current: PollutionCurrentResponse | null | undefined;
}

const AQI_LEVELS = [
  { max: 50, label: "Bom", color: "#16a34a" },
  { max: 100, label: "Moderado", color: "#65a30d" },
  { max: 150, label: "Sensível", color: "#ca8a04" },
  { max: 200, label: "Ruim", color: "#d97706" },
  { max: 300, label: "Muito Ruim", color: "#dc2626" },
  { max: Infinity, label: "Perigoso", color: "#7f1d1d" },
];

function aqiToLevel(aqi: number) {
  for (const l of AQI_LEVELS) {
    if (aqi <= l.max) return l;
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1];
}

const pollutantCards: {
  key: keyof PollutantsDto;
  label: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", icon: "leaf" },
  { key: "pm10", label: "PM10", unit: "µg/m³", icon: "leaf-outline" },
  { key: "co", label: "CO", unit: "µg/m³", icon: "cloud" },
  { key: "no2", label: "NO₂", unit: "µg/m³", icon: "cloudy" },
  { key: "so2", label: "SO₂", unit: "µg/m³", icon: "rainy" },
  { key: "o3", label: "O₃", unit: "µg/m³", icon: "partly-sunny" },
];

export const PollutionCards: React.FC<PollutionCardsProps> = ({ current }) => {
  if (!current) {
    return (
      <View style={styles.cardsEmpty}>
        <Text style={styles.cardsEmptyText}>
          Sem dados de poluição disponíveis.
        </Text>
      </View>
    );
  }

  const level = aqiToLevel(current.aqi);
  const data = current.pollutants;

  return (
    <View style={styles.cardsContainer}>
      {/* AQI Card */}
      <View style={[styles.card, { borderColor: level.color }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer" size={20} color={level.color} />
          <Text style={styles.cardTitle}>AQI</Text>
        </View>
        <View style={styles.cardBodyRow}>
          <Text style={[styles.aqiValue, { color: level.color }]}>
            {current.aqi}
          </Text>
          <View style={[styles.aqiBadge, { backgroundColor: level.color }]}>
            <Text style={styles.aqiBadgeText}>{level.label}</Text>
          </View>
        </View>
        <Text style={styles.cardHint}>
          Índice de Qualidade do Ar (menor é melhor)
        </Text>
      </View>

      {/* Pollutant Cards */}
      {pollutantCards.map((p) => {
        const value = (data as any)?.[p.key] ?? null;
        return (
          <View key={String(p.key)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name={p.icon} size={18} color="#9ca3af" />
              <Text style={styles.cardTitle}>{p.label}</Text>
            </View>
            <Text style={styles.pollutantValue}>
              {value !== null && value !== undefined
                ? Number(value).toFixed(2)
                : "--"}
              <Text style={styles.pollutantUnit}> {p.unit}</Text>
            </Text>
          </View>
        );
      })}
    </View>
  );
};


// -------------------------------
// Helpers & Styles
// -------------------------------

const styles = StyleSheet.create({
  // Toast
  toastContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 9999,
    elevation: 5,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  toastClose: {
    marginLeft: 6,
    padding: 4,
  },

  // Overlay
  overlayBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCard: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    alignItems: "center",
    minWidth: 200,
  },
  overlayText: {
    marginTop: 10,
    color: "#e5e7eb",
  },

  // Cards
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
    width: "48%",
    minWidth: 150,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
  },
  cardBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  aqiValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  aqiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aqiBadgeText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  cardHint: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  pollutantValue: {
    color: "#f3f4f6",
    fontSize: 18,
    fontWeight: "700",
  },
  pollutantUnit: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "400",
  },
  cardsEmpty: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
  },
  cardsEmptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },
});

export default {
  ErrorToast,
  LoadingOverlay,
  PollutionCards,
};
