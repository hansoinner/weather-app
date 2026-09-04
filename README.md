# Weather App

A responsive weather application built with **HTML5, CSS3 and Vanilla JavaScript**. Search for a city or use your current location to view current conditions, detailed weather metrics, an hourly forecast, interactive weather trends, smart alerts and a multi-day forecast.

## Features

- City weather search
- Current-location weather lookup
- Celsius / Fahrenheit toggle
- Temperature unit preference persisted with LocalStorage
- Favorite cities persisted with LocalStorage
- Recent search history persisted with LocalStorage
- Quick loading of saved cities
- Clear search history
- Current temperature and weather condition
- Feels-like temperature
- Humidity
- Wind speed
- Precipitation amount and probability
- Visibility
- Wind direction with compass heading
- Wind gusts
- Sunrise and sunset
- UV index
- 24-hour forecast
- Hourly temperature and weather icons
- Hourly precipitation probability
- Hourly wind speed
- Current hour highlighted
- Horizontally scrollable hourly forecast
- Interactive 24-hour temperature chart
- Interactive precipitation chart
- Interactive wind chart
- Hover and touch chart tooltips
- Responsive canvas charts without external chart libraries
- Smart weather alerts and safe-weather state
- 5-day forecast
- Dynamic weather scenes based on current conditions
- Automatic day/night weather scene
- Dark mode with persisted preference
- Loading and error states
- Responsive layout for desktop, tablet and mobile
- Accessible form controls and weather information
- Automatic local timezone handling
- **Progressive Web App (PWA) support**
- Installable app experience on supported browsers
- Service worker with app-shell caching
- Offline fallback page
- Network-first caching for weather API responses
- Web App Manifest and installable weather icon

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API
- Fetch API
- Service Worker API
- Web App Manifest
- LocalStorage
- Open-Meteo API
- BigDataCloud Reverse Geocoding API
- GitHub Pages

## APIs

Weather and forward geocoding data are provided by [Open-Meteo](https://open-meteo.com/).

Reverse geocoding for the current-location feature uses [BigDataCloud](https://www.bigdatacloud.com/).

## Project Structure

```text
weather-app/
├── index.html
├── style.css
├── script.js
├── charts.js
├── alerts.js
├── pwa.js
├── sw.js
├── manifest.json
├── offline.html
├── icons/
│   └── icon.svg
└── README.md
```

## Run Locally

1. Clone the repository.
2. Open the project folder.
3. Start it with a local development server such as VS Code Live Server.
4. Open the local URL in your browser.

The service worker requires a secure context, so use **HTTPS or localhost**. Opening `index.html` directly with `file://` will not enable PWA features.

The app is a static frontend project and does not require a build step.

## PWA Installation

On supported desktop and Android browsers, the app can be installed from the browser's install UI. When the browser exposes an install prompt, the app also displays an **Install app** button.

On iPhone/iPad, use the browser's **Add to Home Screen** option to install the web app.

After the first successful load, the service worker caches the application shell and can provide the offline fallback page when the network is unavailable. Previously fetched weather API responses may also be available from cache.

## Live Demo

GitHub Pages deployment:

https://hansoinner.github.io/weather-app/

## What This Project Demonstrates

This project demonstrates practical frontend development skills including asynchronous JavaScript, API integration, URL parameters, DOM rendering, form validation, responsive CSS, loading and error handling, browser geolocation, LocalStorage persistence, unit conversion, favorites, search history, detailed weather metrics, dynamic weather scenes, theme persistence, hourly forecast rendering, Canvas API charting, interactive tooltips, responsive data visualization, service workers, caching strategies and Progressive Web App architecture.

## Future Improvements

- Improved weather icons
- Accessibility and performance refinements
- Background weather refresh
- Weather radar integration
- Push notifications for severe weather

## License

This project is intended as a portfolio and learning project.
