"use strict";

const GEOCODING_API="https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEOCODING_API="https://api.bigdatacloud.net/data/reverse-geocode-client";
const WEATHER_API="https://api.open-meteo.com/v1/forecast";
const UNIT_STORAGE_KEY="weather-app-unit";
const FAVORITES_STORAGE_KEY="weather-app-favorites";
const HISTORY_STORAGE_KEY="weather-app-history";

const $=id=>document.getElementById(id);
const weatherForm=$("weather-form"),cityInput=$("city-input"),searchButton=$("search-button"),locationButton=$("location-button");
const searchError=$("search-error"),loadingState=$("loading-state"),weatherError=$("weather-error"),weatherErrorMessage=$("weather-error-message"),weatherContent=$("weather-content");
const cityName=$("city-name"),weatherDate=$("weather-date"),weatherIcon=$("weather-icon"),temperature=$("temperature"),weatherCondition=$("weather-condition"),feelsLike=$("feels-like"),humidity=$("humidity"),windSpeed=$("wind-speed"),forecastGrid=$("forecast-grid"),yearElement=$("year");
const celsiusButton=$("celsius-button"),fahrenheitButton=$("fahrenheit-button"),favoriteButton=$("favorite-button"),favoritesList=$("favorites-list"),historyList=$("history-list"),clearHistoryButton=$("clear-history");

const weatherCodes={0:{description:"Clear sky",icon:"☀️"},1:{description:"Mainly clear",icon:"🌤️"},2:{description:"Partly cloudy",icon:"⛅"},3:{description:"Overcast",icon:"☁️"},45:{description:"Fog",icon:"🌫️"},48:{description:"Depositing rime fog",icon:"🌫️"},51:{description:"Light drizzle",icon:"🌦️"},53:{description:"Moderate drizzle",icon:"🌦️"},55:{description:"Dense drizzle",icon:"🌧️"},56:{description:"Light freezing drizzle",icon:"🌧️"},57:{description:"Dense freezing drizzle",icon:"🌧️"},61:{description:"Slight rain",icon:"🌦️"},63:{description:"Moderate rain",icon:"🌧️"},65:{description:"Heavy rain",icon:"🌧️"},66:{description:"Light freezing rain",icon:"🌧️"},67:{description:"Heavy freezing rain",icon:"🌧️"},71:{description:"Slight snow fall",icon:"🌨️"},73:{description:"Moderate snow fall",icon:"🌨️"},75:{description:"Heavy snow fall",icon:"❄️"},77:{description:"Snow grains",icon:"❄️"},80:{description:"Slight rain showers",icon:"🌦️"},81:{description:"Moderate rain showers",icon:"🌧️"},82:{description:"Violent rain showers",icon:"⛈️"},85:{description:"Slight snow showers",icon:"🌨️"},86:{description:"Heavy snow showers",icon:"❄️"},95:{description:"Thunderstorm",icon:"⛈️"},96:{description:"Thunderstorm with slight hail",icon:"⛈️"},99:{description:"Thunderstorm with heavy hail",icon:"⛈️"}};

let temperatureUnit=getSavedUnit();
let lastWeatherData=null,lastLocation=null;

function readStorage(key,fallback=[]){try{const value=JSON.parse(localStorage.getItem(key));return Array.isArray(value)?value:fallback}catch{return fallback}}
function writeStorage(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{} }
function getSavedUnit(){try{return localStorage.getItem(UNIT_STORAGE_KEY)==="fahrenheit"?"fahrenheit":"celsius"}catch{return"celsius"}}
function getFavorites(){return readStorage(FAVORITES_STORAGE_KEY)}
function getHistory(){return readStorage(HISTORY_STORAGE_KEY)}

function initializeApp(){
    updateFooterYear();updateUnitButtons();renderSavedCities();
    weatherForm.addEventListener("submit",handleWeatherSearch);cityInput.addEventListener("input",clearSearchError);
    locationButton.addEventListener("click",handleLocationRequest);celsiusButton.addEventListener("click",()=>setTemperatureUnit("celsius"));fahrenheitButton.addEventListener("click",()=>setTemperatureUnit("fahrenheit"));
    favoriteButton.addEventListener("click",toggleFavorite);clearHistoryButton.addEventListener("click",clearHistory);
}
function setTemperatureUnit(unit){temperatureUnit=unit;try{localStorage.setItem(UNIT_STORAGE_KEY,unit)}catch{}updateUnitButtons();if(lastWeatherData){renderCurrentWeather(lastWeatherData.current);renderForecast(lastWeatherData.daily)}}
function updateUnitButtons(){const c=temperatureUnit==="celsius";celsiusButton.classList.toggle("active",c);fahrenheitButton.classList.toggle("active",!c);celsiusButton.setAttribute("aria-pressed",String(c));fahrenheitButton.setAttribute("aria-pressed",String(!c))}

async function handleWeatherSearch(event){event.preventDefault();const city=cityInput.value.trim();clearSearchError();if(!city){showSearchError("Please enter a city name.");cityInput.focus();return}if(city.length<2){showSearchError("Please enter at least 2 characters.");cityInput.focus();return}await searchWeather(city)}
async function searchWeather(city){setLoadingState(true);hideWeatherError();hideWeatherContent();setControlsDisabled(true);try{const location=await getCityCoordinates(city);if(!location)throw new Error("We couldn't find that city. Please check the spelling and try again.");const data=await getWeatherData(location.latitude,location.longitude);renderWeather(location,data);saveSearch(location);showWeatherContent()}catch(error){console.error("Weather search failed:",error);showWeatherError(error.message||"Unable to retrieve weather data. Please try again.")}finally{setLoadingState(false);setControlsDisabled(false)}}
async function getCityCoordinates(city){const url=new URL(GEOCODING_API);url.searchParams.set("name",city);url.searchParams.set("count","1");url.searchParams.set("language","en");url.searchParams.set("format","json");const response=await fetch(url);if(!response.ok)throw new Error("Unable to search for that city.");const data=await response.json();return data.results?.[0]||null}
async function getLocationName(latitude,longitude){const url=new URL(REVERSE_GEOCODING_API);url.searchParams.set("latitude",latitude);url.searchParams.set("longitude",longitude);url.searchParams.set("localityLanguage","en");const response=await fetch(url);if(!response.ok)throw new Error("Unable to determine your location name.");const data=await response.json();return{name:data.city||data.locality||data.localityName||"Your Location",admin1:data.principalSubdivision||"",country:data.countryName||"",latitude,longitude}}
async function getWeatherData(latitude,longitude){const url=new URL(WEATHER_API);url.searchParams.set("latitude",latitude);url.searchParams.set("longitude",longitude);url.searchParams.set("current","temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");url.searchParams.set("daily","weather_code,temperature_2m_max,temperature_2m_min");url.searchParams.set("temperature_unit","celsius");url.searchParams.set("wind_speed_unit","kmh");url.searchParams.set("timezone","auto");url.searchParams.set("forecast_days","6");const response=await fetch(url);if(!response.ok)throw new Error("Unable to retrieve weather data.");return response.json()}

async function handleLocationRequest(){if(!navigator.geolocation){showWeatherError("Geolocation is not supported by your browser.");return}setLoadingState(true);hideWeatherError();hideWeatherContent();setControlsDisabled(true);navigator.geolocation.getCurrentPosition(async position=>{try{const{latitude,longitude}=position.coords;const location=await getLocationName(latitude,longitude);const data=await getWeatherData(latitude,longitude);renderWeather(location,data);showWeatherContent()}catch(error){showWeatherError(error.message||"Unable to retrieve weather for your location.")}finally{setLoadingState(false);setControlsDisabled(false)}},error=>{showWeatherError(error.code===1?"Location permission was denied. Please allow location access and try again.":"Unable to determine your location. Please try again.");setLoadingState(false);setControlsDisabled(false)},{enableHighAccuracy:true,timeout:10000,maximumAge:300000})}

function renderWeather(location,data){lastLocation=location;lastWeatherData=data;const parts=[location.name,location.admin1,location.country].filter(Boolean);cityName.textContent=parts.join(", ");weatherDate.textContent=formatCurrentDate(data.current.time,data.timezone);renderCurrentWeather(data.current);renderForecast(data.daily);updateFavoriteButton()}
function renderCurrentWeather(current){const info=getWeatherInfo(current.weather_code);temperature.textContent=formatTemperature(current.temperature_2m);weatherCondition.textContent=info.description;feelsLike.textContent=formatTemperature(current.apparent_temperature);humidity.textContent=`${current.relative_humidity_2m}%`;windSpeed.textContent=`${Math.round(current.wind_speed_10m)} km/h`;weatherIcon.textContent=info.icon;weatherIcon.setAttribute("aria-label",info.description)}
function renderForecast(daily){forecastGrid.innerHTML="";for(let i=0;i<Math.min(daily.time.length,5);i++)forecastGrid.appendChild(createForecastCard(daily,i))}
function createForecastCard(daily,index){const info=getWeatherInfo(daily.weather_code[index]);const card=document.createElement("article");card.className="forecast-card";const day=document.createElement("p");day.className="forecast-day";day.textContent=formatForecastDay(daily.time[index]);const icon=document.createElement("span");icon.className="forecast-icon";icon.setAttribute("role","img");icon.setAttribute("aria-label",info.description);icon.textContent=info.icon;const temp=document.createElement("p");temp.className="forecast-temperature";temp.textContent=`${formatTemperature(daily.temperature_2m_max[index])} / ${formatTemperature(daily.temperature_2m_min[index])}`;const condition=document.createElement("p");condition.className="forecast-condition";condition.textContent=info.description;card.append(day,icon,temp,condition);return card}
function formatTemperature(celsius){const value=temperatureUnit==="fahrenheit"?celsius*9/5+32:celsius;return`${Math.round(value)}°${temperatureUnit==="fahrenheit"?"F":"C"}`}
function getWeatherInfo(code){return weatherCodes[code]||{description:"Unknown",icon:"🌡️"}}
function formatCurrentDate(dateTime,timezone){return new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric",timeZone:timezone}).format(new Date(dateTime))}
function formatForecastDay(dateString){return new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric"}).format(new Date(`${dateString}T12:00:00`))}

function saveSearch(location){const item={name:location.name,admin1:location.admin1||"",country:location.country||"",latitude:location.latitude,longitude:location.longitude};let history=getHistory().filter(x=>x.name.toLowerCase()!==item.name.toLowerCase());history.unshift(item);writeStorage(HISTORY_STORAGE_KEY,history.slice(0,8));renderSavedCities()}
function toggleFavorite(){if(!lastLocation)return;const key=locationKey(lastLocation);let favorites=getFavorites();const exists=favorites.some(item=>locationKey(item)===key);if(exists){favorites=favorites.filter(item=>locationKey(item)!==key)}else{favorites.unshift({name:lastLocation.name,admin1:lastLocation.admin1||"",country:lastLocation.country||"",latitude:lastLocation.latitude,longitude:lastLocation.longitude});favorites=favorites.slice(0,8)}writeStorage(FAVORITES_STORAGE_KEY,favorites);updateFavoriteButton();renderSavedCities()}
function updateFavoriteButton(){if(!lastLocation){favoriteButton.hidden=true;return}favoriteButton.hidden=false;const active=getFavorites().some(item=>locationKey(item)===locationKey(lastLocation));favoriteButton.classList.toggle("active",active);favoriteButton.setAttribute("aria-pressed",String(active));favoriteButton.textContent=active?"★ Remove from favorites":"☆ Add to favorites"}
function locationKey(location){return`${Number(location.latitude).toFixed(3)},${Number(location.longitude).toFixed(3)}`}
function renderSavedCities(){renderList(favoritesList,getFavorites(),"No favorite cities yet.",false);renderList(historyList,getHistory(),"No recent searches yet.",true)}
function renderList(container,items,emptyText,isHistory){container.innerHTML="";if(!items.length){const li=document.createElement("li");li.className="empty-list";li.textContent=emptyText;container.appendChild(li);return}items.forEach(item=>{const li=document.createElement("li");const button=document.createElement("button");button.type="button";button.className="history-item";button.textContent=[item.name,item.country].filter(Boolean).join(", ");button.addEventListener("click",()=>loadSavedCity(item));li.appendChild(button);container.appendChild(li)})}
async function loadSavedCity(location){cityInput.value=location.name;await searchWeather(location.name)}
function clearHistory(){writeStorage(HISTORY_STORAGE_KEY,[]);renderSavedCities()}

function updateFooterYear(){yearElement.textContent=new Date().getFullYear()}
function setLoadingState(isLoading){loadingState.hidden=!isLoading}
function showWeatherContent(){weatherContent.hidden=false}
function hideWeatherContent(){weatherContent.hidden=true}
function showWeatherError(message){weatherErrorMessage.textContent=message;weatherError.hidden=false}
function hideWeatherError(){weatherError.hidden=true}
function showSearchError(message){searchError.textContent=message}
function clearSearchError(){searchError.textContent=""}
function setControlsDisabled(disabled){searchButton.disabled=disabled;locationButton.disabled=disabled;celsiusButton.disabled=disabled;fahrenheitButton.disabled=disabled;favoriteButton.disabled=disabled}

initializeApp();
