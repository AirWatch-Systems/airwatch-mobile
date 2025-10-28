import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PollutionHistoryPointDto } from "../hooks/types";

interface PollutionLineChartProps {
  data: PollutionHistoryPointDto[];
  height?: number;
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export const PollutionLineChart: React.FC<PollutionLineChartProps> = () => {
  return (
    <View style={{
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#1f2937",
      backgroundColor: "#0b1220",
      alignItems: "center",
      gap: 8,
    }}>
      <Ionicons name="bar-chart" size={20} color="#9ca3af" />
      <Text style={{ color: "#9ca3af", fontSize: 13 }}>
        O gráfico está disponível na versão Web (Recharts).
      </Text>
    </View>
  );
};