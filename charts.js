"use strict";

(() => {
    let latestWeatherData = null;
    let activeMetric = "temperature";
    let chartCanvas = null;
    let tooltip = null;
    let chartData = [];

    const metricConfig = {
        temperature: { label: "Temperature", unit: "°", get: item => item.temperature_2m },
        precipitation: { label: "Precipitation", unit: " mm", get: item => item.precipitation },
        wind: { label: "Wind", unit: " km/h", get: item => item.wind_speed_10m }
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        try {
            const url = String(args[0]?.url || args[0] || "");
            if (url.includes("api.open-meteo.com/v1/forecast")) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data?.hourly) {
                        latestWeatherData = data;
                        requestAnimationFrame(() => renderChart());
                    }
                }).catch(() => {});
            }
        } catch {}
        return response;
    };

    function initialize() {
        chartCanvas = document.getElementById("weather-chart");
        tooltip = document.getElementById("chart-tooltip");
        if (!chartCanvas) return;

        document.querySelectorAll("[data-chart-metric]").forEach(button => {
            button.addEventListener("click", () => {
                activeMetric = button.dataset.chartMetric;
                document.querySelectorAll("[data-chart-metric]").forEach(item => {
                    const active = item === button;
                    item.classList.toggle("active", active);
                    item.setAttribute("aria-pressed", String(active));
                });
                renderChart();
            });
        });

        chartCanvas.addEventListener("mousemove", handlePointerMove);
        chartCanvas.addEventListener("mouseleave", hideTooltip);
        chartCanvas.addEventListener("touchmove", event => {
            const touch = event.touches[0];
            if (touch) handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => event.preventDefault() });
        }, { passive: false });
        window.addEventListener("resize", renderChart);
        window.addEventListener("weather:unit-change", renderChart);
        renderChart();
    }

    function getNext24Hours() {
        if (!latestWeatherData?.hourly?.time) return [];
        const hourly = latestWeatherData.hourly;
        const currentTime = latestWeatherData.current?.time;
        let start = hourly.time.findIndex(time => time >= currentTime);
        if (start < 0) start = 0;
        return hourly.time.slice(start, start + 24).map((time, offset) => {
            const index = start + offset;
            return {
                time,
                temperature_2m: hourly.temperature_2m?.[index] ?? null,
                precipitation: hourly.precipitation?.[index] ?? 0,
                wind_speed_10m: hourly.wind_speed_10m?.[index] ?? 0,
                precipitation_probability: hourly.precipitation_probability?.[index] ?? 0
            };
        });
    }

    function renderChart() {
        if (!chartCanvas || !latestWeatherData) return;
        chartData = getNext24Hours();
        if (!chartData.length) return;

        const rect = chartCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(320, rect.width || chartCanvas.clientWidth || 700);
        const height = 300;
        chartCanvas.width = width * dpr;
        chartCanvas.height = height * dpr;
        const ctx = chartCanvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const config = metricConfig[activeMetric];
        const values = chartData.map(config.get).map(value => Number(value) || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = Math.max(max - min, activeMetric === "temperature" ? 4 : 1);
        const padding = { top: 30, right: 22, bottom: 48, left: 48 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        const x = index => padding.left + (index / Math.max(values.length - 1, 1)) * plotWidth;
        const y = value => padding.top + (1 - (value - min) / range) * plotHeight;

        const styles = getComputedStyle(document.body);
        const textColor = styles.getPropertyValue("--text-secondary").trim() || "#64748b";
        const borderColor = styles.getPropertyValue("--border").trim() || "#cbd5e1";
        const primaryColor = styles.getPropertyValue("--primary").trim() || "#2563eb";

        ctx.font = "12px system-ui, sans-serif";
        ctx.fillStyle = textColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const value = min + range * (i / 4);
            const py = y(value);
            ctx.beginPath();
            ctx.moveTo(padding.left, py);
            ctx.lineTo(width - padding.right, py);
            ctx.stroke();
            ctx.fillText(formatValue(value, activeMetric), 6, py + 4);
        }

        ctx.beginPath();
        values.forEach((value, index) => {
            const px = x(index), py = y(value);
            if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        values.forEach((value, index) => {
            ctx.beginPath();
            ctx.arc(x(index), y(value), 4, 0, Math.PI * 2);
            ctx.fillStyle = primaryColor;
            ctx.fill();
        });

        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        chartData.forEach((item, index) => {
            if (index % 3 === 0 || index === values.length - 1) {
                ctx.fillText(formatHour(item.time), x(index), height - 16);
            }
        });
        ctx.textAlign = "start";
    }

    function formatValue(value, metric) {
        if (metric === "temperature") {
            const unit = localStorage.getItem("weather-app-unit") === "fahrenheit" ? "°F" : "°C";
            const converted = unit === "°F" ? value * 9 / 5 + 32 : value;
            return `${Math.round(converted)}${unit}`;
        }
        return `${Number(value).toFixed(1)}${metricConfig[metric].unit}`;
    }

    function formatHour(dateTime) {
        const timezone = latestWeatherData?.timezone;
        return new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: timezone }).format(new Date(dateTime));
    }

    function handlePointerMove(event) {
        if (!chartCanvas || !chartData.length) return;
        const rect = chartCanvas.getBoundingClientRect();
        const paddingLeft = 48;
        const paddingRight = 22;
        const usableWidth = rect.width - paddingLeft - paddingRight;
        const relativeX = Math.max(0, Math.min(usableWidth, event.clientX - rect.left - paddingLeft));
        const index = Math.round(relativeX / usableWidth * (chartData.length - 1));
        const item = chartData[index];
        if (!item) return;

        const config = metricConfig[activeMetric];
        const value = config.get(item);
        tooltip.textContent = `${formatHour(item.time)} · ${formatValue(Number(value), activeMetric)}`;
        tooltip.hidden = false;
        tooltip.style.left = `${Math.min(event.clientX - rect.left + 12, rect.width - 150)}px`;
        tooltip.style.top = `${Math.max(8, event.clientY - rect.top - 42)}px`;
    }

    function hideTooltip() {
        if (tooltip) tooltip.hidden = true;
    }

    document.addEventListener("DOMContentLoaded", initialize);
})();
