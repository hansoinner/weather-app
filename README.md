# Weather App

A responsive weather application built with **HTML5, CSS3 and Vanilla JavaScript**. Search for a city or use your current location to view current weather conditions, detailed weather metrics and a multi-day forecast.

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
- Precipitation amount
- Precipitation probability
- Visibility
- Wind direction with compass heading
- Wind gusts
- Sunrise and sunset
- UV index
- 5-day forecast
- Loading and error states
- Responsive layout for desktop, tablet and mobile
- Accessible form controls and weather information
- Automatic local timezone handling

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
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
└── README.md
```

## Run Locally

1. Clone the repository.
2. Open the project folder.
3. Start it with a local development server such as VS Code Live Server.
4. Open the local URL in your browser.

The app is a static frontend project and does not require a build step.

## Live Demo

GitHub Pages deployment:

https://hansoinner.github.io/weather-app/

## What This Project Demonstrates

This project demonstrates practical frontend development skills including asynchronous JavaScript, API integration, URL parameters, DOM rendering, form validation, responsive CSS, loading and error handling, browser geolocation, LocalStorage persistence, unit conversion, favorites, search history, detailed weather metrics and dynamic forecast cards.

## Future Improvements

- Dynamic weather backgrounds based on conditions
- Dark mode with persisted preference
- Improved weather icons
- Hourly forecast
- Weather alerts
- Interactive temperature and precipitation charts

## License

This project is intended as a portfolio and learning project.
