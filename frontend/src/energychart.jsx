import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip, Legend);

function EnergyChart({ data }) {
  const labels = data.map((d) =>
    d.usageDate
      ? new Date(d.usageDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      : d.usageDate
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Energy Consumption (kWh)",
        data: data.map((d) => d.consumption),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.1)",
        pointBackgroundColor: "#38bdf8",
        pointBorderColor: "#0a0f1e",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { family: "Inter", size: 12 },
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.95)",
        borderColor: "rgba(56,189,248,0.3)",
        borderWidth: 1,
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} kWh`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#64748b", font: { family: "Inter", size: 11 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#64748b", font: { family: "Inter", size: 11 }, callback: (v) => `${v} kWh` },
      },
    },
  };

  return (
    <div style={{ height: "340px", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default EnergyChart;