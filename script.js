const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const suggestionList = document.querySelector('.suggestion-list');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const forecastItemsContainer = document.querySelector('.forecast-items-container');

const apikey = '073f25b6e16e0b2039cb73f965e85148';

// Autocomplete suggestions
cityInput.addEventListener('input', async () => {
  const val = cityInput.value.trim();
  suggestionList.innerHTML = '';
  if (val.length < 2) return;

  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(val)}&limit=10&appid=${apikey}`
    );
    const places = await geoRes.json();
    const seen = new Set();

    places.forEach(loc => {
      const fullName = [loc.name, loc.state, loc.country].filter(Boolean).join(', ');
      if (seen.has(fullName.toLowerCase())) return;
      seen.add(fullName.toLowerCase());

      const li = document.createElement('li');
      li.textContent = fullName;
      li.dataset.lat = loc.lat;
      li.dataset.lon = loc.lon;

      li.addEventListener('click', () => {
        cityInput.value = fullName;
        suggestionList.innerHTML = '';
        updateWeatherByCoords(loc.lat, loc.lon, fullName);
      });

      suggestionList.appendChild(li);
    });
  } catch (err) {
    console.error('Geo API error:', err);
  }
});

searchBtn.addEventListener('click', () => {
  const query = cityInput.value.trim();
  if (!query) return;
  suggestionList.innerHTML = '';
  updateWeatherByName(query);
});

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

cityInput.addEventListener('blur', () => {
  setTimeout(() => (suggestionList.innerHTML = ''), 200);
});

async function updateWeatherByName(name) {
  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(name)}&limit=1&appid=${apikey}`
    );
    const places = await geoRes.json();
    if (!places.length) {
      showDisplaySection(notFoundSection);
      return;
    }
    const { lat, lon } = places[0];
    updateWeatherByCoords(lat, lon, name);
  } catch {
    showDisplaySection(notFoundSection);
  }
}

async function updateWeatherByCoords(lat, lon, placeName) {
  try {
    const [weather, forecast] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}&units=metric`
      ).then(r => r.json()),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apikey}&units=metric`
      ).then(r => r.json())
    ]);

    if (weather.cod !== 200 || !forecast.list) {
      showDisplaySection(notFoundSection);
      return;
    }

    countryTxt.textContent = placeName;
    tempTxt.textContent = `${Math.round(weather.main.temp)}°C`;
    conditionTxt.textContent = weather.weather[0].main;
    humidityValueTxt.textContent = `${weather.main.humidity}%`;
    windValueTxt.textContent = `${weather.wind.speed} M/s`;
    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(weather.weather[0].id)}`;

    updateForecastList(forecast);
    showDisplaySection(weatherInfoSection);
  } catch (err) {
    console.error(err);
    showDisplaySection(notFoundSection);
  }
}

function updateForecastList(forecastData) {
  forecastItemsContainer.innerHTML = '';
  const today = new Date().toISOString().split('T')[0];
  forecastData.list.forEach(item => {
    if (item.dt_txt.includes('12:00:00') && !item.dt_txt.includes(today)) {
      const date = new Date(item.dt_txt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      });
      const icon = getWeatherIcon(item.weather[0].id);
      const temp = Math.round(item.main.temp);
      forecastItemsContainer.insertAdjacentHTML(
        'beforeend',
        `<div class="forecast-item">
          <h5 class="forecast-item-date regular-txt">${date}</h5>
          <img src="assets/weather/${icon}" class="forecast-item-img"/>
          <h5 class="forecast-item-temp">${temp} °C</h5>
        </div>`
      );
    }
  });
}

function getWeatherIcon(id) {
  if (id <= 232) return 'thunderstorm.svg';
  if (id <= 321) return 'drizzle.svg';
  if (id <= 531) return 'rain.svg';
  if (id <= 622) return 'snow.svg';
  if (id <= 781) return 'atmosphere.svg';
  if (id === 800) return 'clear.svg';
  return 'clouds.svg';
}

function getCurrentDate() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

function showDisplaySection(section) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach(sec => {
    sec.style.display = 'none';
  });
  section.style.display = 'flex';
}
