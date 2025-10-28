import { Platform } from "react-native";

const PollutionLineChart =
  Platform.OS === "web"
    ? require("./PollutionLineChart.web").PollutionLineChart
    : require("./PollutionLineChart.native").PollutionLineChart;

export { PollutionLineChart };