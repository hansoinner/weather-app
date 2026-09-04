"use strict";

(() => {
    let latestWeatherData = null;
    let latestLocation = null;

    const weatherCodes = {
        0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",
        51:"Light drizzle",53:"Drizzle",55:"Dense drizzle",56:"Freezing drizzle",57:"Dense freezing drizzle",
        61:"Light rain",63:"Moderate rain",65:"Heavy rain",66:"Freezing rain",67:"Heavy freezing rain",
        71:"Light snow",73:"Moderate snow",75:"Heavy snow",77:"Snow grains",80:"Rain showers",81:"Rain showers",
        82:"Heavy rain showers",85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with heavy hail"
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        try {
            const url = String(args[0]?.url || args[0] || "");
            if (url.includes("api.open-meteo.com/v1/forecast")) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data?.current && data?.hourly) {
                        latestWeatherData = data;
                        requestAnimationFrame(renderAlerts);
                    }
                }).catch(() => {});
            }
            if (url.includes("geocoding-api.open-meteo.com/v1/search")) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data?.results?.[0]) latestLocation = data.results[0];
                }).catch(() => {});
            }
        } catch {}
        return response;
    };

    function renderAlerts() {
        const container = document.getElementById("alerts-list");
        if (!container || !latestWeatherData) return;
        const current = latestWeatherData.current;
        const hourly = latestWeatherData.hourly;
        const daily = latestWeatherData.daily;
        const alerts = buildAlerts(current, hourly, daily);
        container.innerHTML = "";
        if (!alerts.length) {
            const safe = document.createElement("div");
            safe.className = "weather-alert safe";
            safe.innerHTML = "<strong>✅ No significant weather alerts</strong><p>Conditions look relatively calm based on the available forecast.</p>";
            container.appendChild(safe);
            return;
        }
        alerts.forEach(alert => {
            const card = document.createElement("article");
            card.className = `weather-alert ${alert.level}`;
            card.innerHTML = `<div class="weather-alert-icon" aria-hidden="true">${alert.icon}</div><div><h3>${alert.title}</h3><p>${alert.message}</p></div>`;
            container.appendChild(card);
        });
    }

    function buildAlerts(current, hourly, daily) {
        const alerts = [];
        const codes = hourly.weather_code?.slice(0, 24) || [];
        const rainChance = Math.max(...(hourly.precipitation_probability?.slice(0,24) || [0]));
        const precipitation = Math.max(...(hourly.precipitation?.slice(0,24) || [0]));
        const wind = Math.max(...(hourly.wind_speed_10m?.slice(0,24) || [0]));
        const gust = Number(current.wind_gusts_10m || 0);
        const uv = Number(daily.uv_index_max?.[0] || 0);
        const temp = Number(current.temperature_2m);
        const maxTemp = Number(daily.temperature_2m_max?.[0] ?? temp);
        const minTemp = Number(daily.temperature_2m_min?.[0] ?? temp);

        if (codes.some(code => [95,96,99].includes(code))) alerts.push({level:"danger",icon:"⛈️",title:"Thunderstorm possible",message:"Thunderstorm conditions are present in the next 24 hours. Consider delaying exposed outdoor activities."});
        if (wind >= 50 || gust >= 70) alerts.push({level:"danger",icon:"💨",title:"Strong winds",message:`Wind may reach ${Math.round(Math.max(wind,gust))} km/h. Secure loose outdoor items and take care when travelling.`});
        else if (wind >= 35 || gust >= 50) alerts.push({level:"warning",icon:"🌬️",title:"Breezy conditions",message:`Winds may reach ${Math.round(Math.max(wind,gust))} km/h. Be prepared for noticeably windy conditions.`});
        if (rainChance >= 70 || precipitation >= 8) alerts.push({level:"warning",icon:"🌧️",title:"Rain likely",message:`There is a ${Math.round(rainChance)}% chance of precipitation in the next 24 hours. An umbrella may be useful.`});
        if (codes.some(code => [71,73,75,77,85,86].includes(code))) alerts.push({level:"info",icon:"❄️",title:"Snow possible",message:"Snow is included in the next 24-hour forecast. Allow extra time for travel if conditions deteriorate."});
        if (uv >= 7) alerts.push({level:"warning",icon:"☀️",title:"High UV index",message:`The UV index may reach ${uv.toFixed(1)} today. Consider sun protection, especially around midday.`});
        else if (uv >= 5) alerts.push({level:"info",icon:"🧴",title:"Moderate UV",message:`The UV index may reach ${uv.toFixed(1)} today. Sun protection is recommended during stronger daylight hours.`});
        if (maxTemp >= 30) alerts.push({level:"warning",icon:"🥵",title:"Hot conditions",message:`Temperatures may reach ${Math.round(maxTemp)}°C today. Stay hydrated and take breaks from direct heat.`});
        if (minTemp <= 0) alerts.push({level:"info",icon:"🥶",title:"Freezing temperatures",message:`Temperatures may fall to ${Math.round(minTemp)}°C. Watch for icy or slippery conditions.`});
        if (temp <= 0 && current.weather_code === 0) alerts.push({level:"info",icon:"🧊",title:"Cold and clear",message:"It is currently freezing despite clear conditions. Dress warmly and be aware of icy surfaces."});
        return alerts.slice(0,6);
    }

    document.addEventListener("DOMContentLoaded", () => {
        const target = document.getElementById("alerts-list");
        if (target) renderAlerts();
        window.addEventListener("weather:unit-change", renderAlerts);
    });
})();
