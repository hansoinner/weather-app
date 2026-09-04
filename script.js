"use strict";

const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEOCODING_API = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const UNIT_STORAGE_KEY = "weather-app-unit";

const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const locationButton = document.getElementById("location-button");
const searchError = document.getElementById("search-error");
const loadingState = document.getElementById("loading-state");
const weatherError = document.getElementById("weather-error");
const weatherErrorMessage = document.getElementById("weather-error-message");
const weatherContent = document.getElementById("weather-content");
const cityName = document.getElementById("city-name");
const weatherDate = document.getElementById("weather-date");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weather-condition");
const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const forecastGrid = document.getElementById("forecast-grid");
const yearElement = document.getElementById("year");
const celsiusButton = document.getElementById("celsius-button");
const fahrenheitButton = document.getElementById("fahrenheit-button");

const weatherCodes = {
    0:{description:"Clear sky",icon:"☀️"},1:{description:"Mainly clear",icon:"🌤️"},2:{description:"Partly cloudy",icon:"⛅"},3:{description:"Overcast",icon:"☁️"},
    45:{description:"Fog",icon:"🌫️"},48:{description:"Depositing rime fog",icon:"🌫️"},51:{description:"Light drizzle",icon:"🌦️"},53:{description:"Moderate drizzle",icon:"🌦️"},55:{description:"Dense drizzle",icon:"🌧️"},
    56:{description:"Light freezing drizzle",icon:"🌧️"},57:{description:"Dense freezing drizzle",icon:"🌧️"},61:{description:"Slight rain",icon:"🌦️"},63:{description:"Moderate rain",icon:"🌧️"},65:{description:"Heavy rain",icon:"🌧️"},
    66:{description:"Light freezing rain",icon:"🌧️"},67:{description:"Heavy freezing rain",icon:"🌧️"},71:{description:"Slight snow fall",icon:"🌨️"},73:{description:"Moderate snow fall",icon:"🌨️"},75:{description:"Heavy snow fall",icon:"❄️"},
    77:{description:"Snow grains",icon:"❄️"},80:{description:"Slight rain showers",icon:"🌦️"},81:{description:"Moderate rain showers",icon:"🌧️"},82:{description:"Violent rain showers",icon:"⛈️"},85:{description:"Slight snow showers",icon:"🌨️"},
    86:{description:"Heavy snow showers",icon:"❄️"},95:{description:"Thunderstorm",icon:"⛈️"},96:{description:"Thunderstorm with slight hail",icon:"⛈️"},99:{description:"Thunderstorm with heavy hail",icon:"⛈️"}
};

let temperatureUnit = getSavedUnit();
let lastWeatherData = null;

function initializeApp() {
    updateFooterYear();
    updateUnitButtons();
    weatherForm.addEventListener("submit", handleWeatherSearch);
    cityInput.addEventListener("input", clearSearchError);
    locationButton.addEventListener("click", handleLocationRequest);
    celsiusButton.addEventListener("click", () => setTemperatureUnit("celsius"));
    fahrenheitButton.addEventListener("click", () => setTemperatureUnit("fahrenheit"));
}

function getSavedUnit() {
    try {
        const saved = localStorage.getItem(UNIT_STORAGE_KEY);
        return saved === "fahrenheit" ? "fahrenheit" : "celsius";
    } catch { return "celsius"; }
}

function setTemperatureUnit(unit) {
    temperatureUnit = unit;
    try { localStorage.setItem(UNIT_STORAGE_KEY, unit); } catch {}
    updateUnitButtons();
    if (lastWeatherData) renderCurrentWeather(lastWeatherData.current);
    if (lastWeatherData) renderForecast(lastWeatherData.daily);
}

function updateUnitButtons() {
    const celsius = temperatureUnit === "celsius";
    celsiusButton.classList.toggle("active", celsius);
    fahrenheitButton.classList.toggle("active", !celsius);
    celsiusButton.setAttribute("aria-pressed", String(celsius));
    fahrenheitButton.setAttribute("aria-pressed", String(!celsius));
}

async function handleWeatherSearch(event) {
    event.preventDefault();
    const city = cityInput.value.trim();
    clearSearchError();
    if (!city) return showSearchError("Please enter a city name."), cityInput.focus();
    if (city.length < 2) return showSearchError("Please enter at least 2 characters."), cityInput.focus();
    await searchWeather(city);
}

async function searchWeather(city) {
    setLoadingState(true); hideWeatherError(); hideWeatherContent(); setControlsDisabled(true);
    try {
        const location = await getCityCoordinates(city);
        if (!location) throw new Error("We couldn't find that city. Please check the spelling and try again.");
        const data = await getWeatherData(location.latitude, location.longitude);
        renderWeather(location, data);
        showWeatherContent();
    } catch (error) {
        console.error("Weather search failed:", error);
        showWeatherError(error.message || "Unable to retrieve weather data. Please try again.");
    } finally { setLoadingState(false); setControlsDisabled(false); }
}

async function getCityCoordinates(city) {
    const url = new URL(GEOCODING_API);
    url.searchParams.set("name", city); url.searchParams.set("count", "1"); url.searchParams.set("language", "en"); url.searchParams.set("format", "json");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to search for that city.");
    const data = await response.json();
    return data.results?.[0] || null;
}

async function getLocationName(latitude, longitude) {
    const url = new URL(REVERSE_GEOCODING_API);
    url.searchParams.set("latitude", latitude); url.searchParams.set("longitude", longitude); url.searchParams.set("localityLanguage", "en");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to determine your location name.");
    const data = await response.json();
    return { name:data.city || data.locality || data.localityName || "Your Location", admin1:data.principalSubdivision || "", country:data.countryName || "", latitude, longitude };
}

async function getWeatherData(latitude, longitude) {
    const url = new URL(WEATHER_API);
    url.searchParams.set("latitude", latitude); url.searchParams.set("longitude", longitude);
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    url.searchParams.set("temperature_unit", "celsius"); url.searchParams.set("wind_speed_unit", "kmh"); url.searchParams.set("timezone", "auto"); url.searchParams.set("forecast_days", "6");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to retrieve weather data.");
    return response.json();
}

async function handleLocationRequest() {
    if (!navigator.geolocation) return showWeatherError("Geolocation is not supported by your browser.");
    setLoadingState(true); hideWeatherError(); hideWeatherContent(); setControlsDisabled(true);
    navigator.geolocation.getCurrentPosition(async position => {
        try {
            const { latitude, longitude } = position.coords;
            const location = await getLocationName(latitude, longitude);
            const data = await getWeatherData(latitude, longitude);
            renderWeather(location, data); showWeatherContent();
        } catch (error) { showWeatherError(error.message || "Unable to retrieve weather for your location."); }
        finally { setLoadingState(false); setControlsDisabled(false); }
    }, error => {
        const message = error.code === 1 ? "Location permission was denied. Please allow location access and try again." : "Unable to determine your location. Please try again.";
        showWeatherError(message); setLoadingState(false); setControlsDisabled(false);
    }, { enableHighAccuracy:true, timeout:10000, maximumAge:300000 });
}

function renderWeather(location, data) {
    lastWeatherData = data;
    const parts = [location.name, location.admin1, location.country].filter(Boolean);
    cityName.textContent = parts.join(", ");
    weatherDate.textContent = formatCurrentDate(data.current.time, data.timezone);
    renderCurrentWeather(data.current); renderForecast(data.daily);
}

function renderCurrentWeather(current) {
    const info = getWeatherInfo(current.weather_code);
    temperature.textContent = formatTemperature(current.temperature_2m);
    weatherCondition.textContent = info.description;
    feelsLike.textContent = formatTemperature(current.apparent_temperature);
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    weatherIcon.textContent = info.icon;
    weatherIcon.setAttribute("aria-label", info.description);
}

function renderForecast(daily) {
    forecastGrid.innerHTML = "";
    const days = Math.min(daily.time.length, 5);
    for (let index = 0; index < days; index++) forecastGrid.appendChild(createForecastCard(daily, index));
}

function createForecastCard(daily, index) {
    const info = getWeatherInfo(daily.weather_code[index]);
    const card = document.createElement("article"); card.className = "forecast-card";
    const day = document.createElement("p"); day.className = "forecast-day"; day.textContent = formatForecastDay(daily.time[index]);
    const icon = document.createElement("span"); icon.className = "forecast-icon"; icon.setAttribute("role", "img"); icon.setAttribute("aria-label", info.description); icon.textContent = info.icon;
    const temp = document.createElement("p"); temp.className = "forecast-temperature"; temp.textContent = `${formatTemperature(daily.temperature_2m_max[index])} / ${formatTemperature(daily.temperature_2m_min[index])}`;
    const condition = document.createElement("p"); condition.className = "forecast-condition"; condition.textContent = info.description;
    card.append(day, icon, temp, condition); return card;
}

function formatTemperature(celsius) {
    const value = temperatureUnit === "fahrenheit" ? (celsius * 9) / 5 + 32 : celsius;
    return `${Math.round(value)}°${temperatureUnit === "fahrenheit" ? "F" : "C"}`;
}

function getWeatherInfo(code) { return weatherCodes[code] || { description:"Unknown", icon:"🌡️" }; }

function formatCurrentDate(dateTime, timezone) {
    return new Intl.DateTimeFormat("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric", timeZone:timezone }).format(new Date(dateTime));
}

function formatForecastDay(dateString) {
    return new Intl.DateTimeFormat("en-US", { weekday:"short", month:"short", day:"numeric" }).format(new Date(`${dateString}T12:00:00`));
}

function updateFooterYear() { yearElement.textContent = new Date().getFullYear(); }
function setLoadingState(isLoading) { loadingState.hidden = !isLoading; }
function showWeatherContent() { weatherContent.hidden = false; }
function hideWeatherContent() { weatherContent.hidden = true; }
function showWeatherError(message) { weatherErrorMessage.textContent = message; weatherError.hidden = false; }
function hideWeatherError() { weatherError.hidden = true; }
function showSearchError(message) { searchError.textContent = message; }
function clearSearchError() { searchError.textContent = ""; }
function setControlsDisabled(disabled) { searchButton.disabled = disabled; locationButton.disabled = disabled; celsiusButton.disabled = disabled; fahrenheitButton.disabled = disabled; }

initializeApp();
