
"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const REVERSE_GEOCODING_API =
    "https://api.bigdatacloud.net/data/reverse-geocode-client";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const weatherForm =
    document.getElementById("weather-form");

const cityInput =
    document.getElementById("city-input");

const searchButton =
    document.getElementById("search-button");

const locationButton =
    document.getElementById("location-button");

const searchError =
    document.getElementById("search-error");

const loadingState =
    document.getElementById("loading-state");

const weatherError =
    document.getElementById("weather-error");

const weatherErrorMessage =
    document.getElementById(
        "weather-error-message"
    );

const weatherContent =
    document.getElementById(
        "weather-content"
    );

const cityName =
    document.getElementById(
        "city-name"
    );

const weatherDate =
    document.getElementById(
        "weather-date"
    );

const weatherIcon =
    document.getElementById(
        "weather-icon"
    );

const temperature =
    document.getElementById(
        "temperature"
    );

const weatherCondition =
    document.getElementById(
        "weather-condition"
    );

const feelsLike =
    document.getElementById(
        "feels-like"
    );

const humidity =
    document.getElementById(
        "humidity"
    );

const windSpeed =
    document.getElementById(
        "wind-speed"
    );

const forecastGrid =
    document.getElementById(
        "forecast-grid"
    );

const yearElement =
    document.getElementById(
        "year"
    );


/* =========================================================
   WEATHER CODE MAP
========================================================= */

const weatherCodes = {
    0: {
        description: "Clear sky",
        icon: "☀️"
    },

    1: {
        description: "Mainly clear",
        icon: "🌤️"
    },

    2: {
        description: "Partly cloudy",
        icon: "⛅"
    },

    3: {
        description: "Overcast",
        icon: "☁️"
    },

    45: {
        description: "Fog",
        icon: "🌫️"
    },

    48: {
        description: "Depositing rime fog",
        icon: "🌫️"
    },

    51: {
        description: "Light drizzle",
        icon: "🌦️"
    },

    53: {
        description: "Moderate drizzle",
        icon: "🌦️"
    },

    55: {
        description: "Dense drizzle",
        icon: "🌧️"
    },

    56: {
        description: "Light freezing drizzle",
        icon: "🌧️"
    },

    57: {
        description: "Dense freezing drizzle",
        icon: "🌧️"
    },

    61: {
        description: "Slight rain",
        icon: "🌦️"
    },

    63: {
        description: "Moderate rain",
        icon: "🌧️"
    },

    65: {
        description: "Heavy rain",
        icon: "🌧️"
    },

    66: {
        description: "Light freezing rain",
        icon: "🌧️"
    },

    67: {
        description: "Heavy freezing rain",
        icon: "🌧️"
    },

    71: {
        description: "Slight snow fall",
        icon: "🌨️"
    },

    73: {
        description: "Moderate snow fall",
        icon: "🌨️"
    },

    75: {
        description: "Heavy snow fall",
        icon: "❄️"
    },

    77: {
        description: "Snow grains",
        icon: "❄️"
    },

    80: {
        description: "Slight rain showers",
        icon: "🌦️"
    },

    81: {
        description: "Moderate rain showers",
        icon: "🌧️"
    },

    82: {
        description: "Violent rain showers",
        icon: "⛈️"
    },

    85: {
        description: "Slight snow showers",
        icon: "🌨️"
    },

    86: {
        description: "Heavy snow showers",
        icon: "❄️"
    },

    95: {
        description: "Thunderstorm",
        icon: "⛈️"
    },

    96: {
        description:
            "Thunderstorm with slight hail",
        icon: "⛈️"
    },

    99: {
        description:
            "Thunderstorm with heavy hail",
        icon: "⛈️"
    }
};


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeApp() {

    updateFooterYear();

    weatherForm.addEventListener(
        "submit",
        handleWeatherSearch
    );

    cityInput.addEventListener(
        "input",
        clearSearchError
    );

    locationButton.addEventListener(
        "click",
        handleLocationRequest
    );
}


/* =========================================================
   CITY WEATHER SEARCH
========================================================= */

async function handleWeatherSearch(event) {

    event.preventDefault();

    const city =
        cityInput.value.trim();

    clearSearchError();

    if (!city) {

        showSearchError(
            "Please enter a city name."
        );

        cityInput.focus();

        return;
    }

    if (city.length < 2) {

        showSearchError(
            "Please enter at least 2 characters."
        );

        cityInput.focus();

        return;
    }

    await searchWeather(city);
}


/* =========================================================
   SEARCH WEATHER
========================================================= */

async function searchWeather(city) {

    setLoadingState(true);

    hideWeatherError();
    hideWeatherContent();

    setSearchButtonState(true);
    setLocationButtonState(true);

    try {

        const location =
            await getCityCoordinates(
                city
            );

        if (!location) {

            throw new Error(
                "We couldn't find that city. Please check the spelling and try again."
            );
        }

        const weatherData =
            await getWeatherData(
                location.latitude,
                location.longitude
            );

        renderWeather(
            location,
            weatherData
        );

        showWeatherContent();

    } catch (error) {

        console.error(
            "Weather search failed:",
            error
        );

        showWeatherError(
            error.message ||
            "Unable to retrieve weather data. Please try again."
        );

    } finally {

        setLoadingState(false);

        setSearchButtonState(false);
        setLocationButtonState(false);
    }
}


/* =========================================================
   GEOCODING
========================================================= */

async function getCityCoordinates(city) {

    const url =
        new URL(GEOCODING_API);

    url.searchParams.set(
        "name",
        city
    );

    url.searchParams.set(
        "count",
        "1"
    );

    url.searchParams.set(
        "language",
        "en"
    );

    url.searchParams.set(
        "format",
        "json"
    );

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Unable to search for that city."
        );
    }

    const data =
        await response.json();

    if (
        !data.results ||
        data.results.length === 0
    ) {
        return null;
    }

    return data.results[0];
}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

async function getLocationName(
    latitude,
    longitude
) {

    const url =
        new URL(
            REVERSE_GEOCODING_API
        );

    url.searchParams.set(
        "latitude",
        latitude
    );

    url.searchParams.set(
        "longitude",
        longitude
    );

    url.searchParams.set(
        "localityLanguage",
        "en"
    );

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Unable to determine your location name."
        );
    }

    const data =
        await response.json();

    return {
        name:
            data.city ||
            data.locality ||
            data.localityName ||
            "Your Location",

        admin1:
            data.principalSubdivision ||
            "",

        country:
            data.countryName ||
            "",

        latitude,
        longitude
    };
}


/* =========================================================
   WEATHER API
========================================================= */

async function getWeatherData(
    latitude,
    longitude
) {

    const url =
        new URL(WEATHER_API);

    url.searchParams.set(
        "latitude",
        latitude
    );

    url.searchParams.set(
        "longitude",
        longitude
    );

    url.searchParams.set(
        "current",
        [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m"
        ].join(",")
    );

    url.searchParams.set(
        "daily",
        [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min"
        ].join(",")
    );

    url.searchParams.set(
        "temperature_unit",
        "celsius"
    );

    url.searchParams.set(
        "wind_speed_unit",
        "kmh"
    );

    url.searchParams.set(
        "timezone",
        "auto"
    );

    url.searchParams.set(
        "forecast_days",
        "6"
    );

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Unable to retrieve weather data."
        );
    }

    return await response.json();
}


/* =========================================================
   RENDER WEATHER
========================================================= */

function renderWeather(
    location,
    data
) {

    renderLocation(
        location,
        data
    );

    renderCurrentWeather(
        data.current
    );

    renderForecast(
        data.daily
    );
}


/* =========================================================
   RENDER LOCATION
========================================================= */

function renderLocation(
    location,
    data
) {

    const locationParts = [
        location.name,
        location.admin1,
        location.country
    ].filter(Boolean);

    cityName.textContent =
        locationParts.join(", ");

    weatherDate.textContent =
        formatCurrentDate(
            data.current.time,
            data.timezone
        );
}


/* =========================================================
   RENDER CURRENT WEATHER
========================================================= */

function renderCurrentWeather(
    current
) {

    const weatherInfo =
        getWeatherInfo(
            current.weather_code
        );

    temperature.textContent =
        `${Math.round(
            current.temperature_2m
        )}°C`;

    weatherCondition.textContent =
        weatherInfo.description;

    feelsLike.textContent =
        `${Math.round(
            current.apparent_temperature
        )}°C`;

    humidity.textContent =
        `${current.relative_humidity_2m}%`;

    windSpeed.textContent =
        `${Math.round(
            current.wind_speed_10m
        )} km/h`;

    weatherIcon.textContent =
        weatherInfo.icon;

    weatherIcon.setAttribute(
        "role",
        "img"
    );

    weatherIcon.setAttribute(
        "aria-label",
        weatherInfo.description
    );
}


/* =========================================================
   RENDER FORECAST
========================================================= */

function renderForecast(
    daily
) {

    forecastGrid.innerHTML = "";

    const daysToShow =
        Math.min(
            daily.time.length,
            5
        );

    for (
        let index = 0;
        index < daysToShow;
        index++
    ) {

        const card =
            createForecastCard(
                daily,
                index
            );

        forecastGrid.appendChild(
            card
        );
    }
}


/* =========================================================
   CREATE FORECAST CARD
========================================================= */

function createForecastCard(
    daily,
    index
) {

    const weatherInfo =
        getWeatherInfo(
            daily.weather_code[index]
        );

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "forecast-card";


    const day =
        document.createElement(
            "p"
        );

    day.className =
        "forecast-day";

    day.textContent =
        formatForecastDay(
            daily.time[index]
        );


    const icon =
        document.createElement(
            "span"
        );

    icon.className =
        "forecast-icon";

    icon.setAttribute(
        "role",
        "img"
    );

    icon.setAttribute(
        "aria-label",
        weatherInfo.description
    );

    icon.textContent =
        weatherInfo.icon;


    const temp =
        document.createElement(
            "p"
        );

    temp.className =
        "forecast-temperature";

    temp.textContent =
        `${Math.round(
            daily.temperature_2m_max[index]
        )}° / ${Math.round(
            daily.temperature_2m_min[index]
        )}°`;


    const condition =
        document.createElement(
            "p"
        );

    condition.className =
        "forecast-condition";

    condition.textContent =
        weatherInfo.description;


    card.append(
        day,
        icon,
        temp,
        condition
    );

    return card;
}


/* =========================================================
   WEATHER INFORMATION
========================================================= */

function getWeatherInfo(
    weatherCode
) {

    return (
        weatherCodes[weatherCode] || {
            description: "Unknown",
            icon: "🌡️"
        }
    );
}


/* =========================================================
   DATE FORMATTING
========================================================= */

function formatCurrentDate(
    dateTime,
    timezone
) {

    const date =
        new Date(dateTime);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: timezone
        }
    ).format(date);
}


function formatForecastDay(
    dateString
) {

    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "short"
        }
    ).format(date);
}


/* =========================================================
   USER LOCATION
========================================================= */

function handleLocationRequest() {

    clearSearchError();

    hideWeatherError();
    hideWeatherContent();

    if (!navigator.geolocation) {

        showWeatherError(
            "Geolocation is not supported by your browser."
        );

        return;
    }

    setLocationButtonState(true);
    setSearchButtonState(true);
    setLoadingState(true);

    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}


/* =========================================================
   LOCATION SUCCESS
========================================================= */

async function handleLocationSuccess(
    position
) {

    const {
        latitude,
        longitude
    } = position.coords;

    try {

        /*
         * Get weather first.
         * The weather should still work even if
         * reverse geocoding fails.
         */

        const weatherData =
            await getWeatherData(
                latitude,
                longitude
            );


        /*
         * Try to determine the city name.
         */

        let location = {
            name: "Your Location",
            latitude,
            longitude
        };

        try {

            const resolvedLocation =
                await getLocationName(
                    latitude,
                    longitude
                );

            if (resolvedLocation) {

                location =
                    resolvedLocation;
            }

        } catch (error) {

            /*
             * Reverse geocoding is optional.
             * Do not prevent the weather from displaying.
             */

            console.warn(
                "Reverse geocoding failed:",
                error
            );
        }


        renderWeather(
            location,
            weatherData
        );

        showWeatherContent();

    } catch (error) {

        console.error(
            "Location weather failed:",
            error
        );

        showWeatherError(
            error.message ||
            "Unable to retrieve weather for your location."
        );

    } finally {

        setLoadingState(false);

        setLocationButtonState(false);
        setSearchButtonState(false);
    }
}


/* =========================================================
   LOCATION ERROR
========================================================= */

function handleLocationError(
    error
) {

    let message =
        "Unable to determine your location.";

    switch (error.code) {

        case error.PERMISSION_DENIED:

            message =
                "Location access was denied. Please allow location access and try again.";

            break;


        case error.POSITION_UNAVAILABLE:

            message =
                "Your location could not be determined.";

            break;


        case error.TIMEOUT:

            message =
                "Location request timed out. Please try again.";

            break;
    }

    setLoadingState(false);

    showWeatherError(
        message
    );

    setLocationButtonState(false);
    setSearchButtonState(false);
}


/* =========================================================
   LOADING STATE
========================================================= */

function setLoadingState(
    isLoading
) {

    loadingState.hidden =
        !isLoading;
}


/* =========================================================
   WEATHER CONTENT
========================================================= */

function showWeatherContent() {

    weatherContent.hidden =
        false;
}


function hideWeatherContent() {

    weatherContent.hidden =
        true;
}


/* =========================================================
   ERROR STATE
========================================================= */

function showSearchError(
    message
) {

    searchError.textContent =
        message;
}


function clearSearchError() {

    searchError.textContent =
        "";
}


function showWeatherError(
    message
) {

    weatherErrorMessage.textContent =
        message;

    weatherError.hidden =
        false;
}


function hideWeatherError() {

    weatherError.hidden =
        true;
}


/* =========================================================
   SEARCH BUTTON
========================================================= */

function setSearchButtonState(
    isLoading
) {

    searchButton.disabled =
        isLoading;

    searchButton.textContent =
        isLoading
            ? "Searching..."
            : "Search";
}


/* =========================================================
   LOCATION BUTTON
========================================================= */

function setLocationButtonState(
    isLoading
) {

    locationButton.disabled =
        isLoading;

    locationButton.textContent =
        isLoading
            ? "📍 Finding location..."
            : "📍 Use My Location";
}


/* =========================================================
   FOOTER YEAR
========================================================= */

function updateFooterYear() {

    yearElement.textContent =
        new Date().getFullYear();
}


/* =========================================================
   START APPLICATION
========================================================= */

initializeApp();
