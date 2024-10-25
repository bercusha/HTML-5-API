const openWeatherApiKey = "db7fa9aa2e98fe2b45b9687d39127470";

// Проверка поддержки HTML5 API
function checkHtml5ApiSupport() {
  const features = {
    "Geolocation API": "geolocation" in navigator,
    "LocalStorage": "localStorage" in window
  };
  console.log("Поддержка HTML5 API:", features);
}

window.onload = checkHtml5ApiSupport;

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    document.getElementById("location").textContent = "Геолокация не поддерживается";
  }
}

function showPosition(position) {
  const { latitude, longitude } = position.coords;
  document.getElementById("location").textContent =
    `Ваши координаты: Широта: ${latitude}, Долгота: ${longitude}`;
  localStorage.setItem("myLastLocation", JSON.stringify({ latitude, longitude }));
}

getLocation();

async function getWeather(lat, lon) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric&lang=ru`);
  const data = await response.json();
  return `${data.main.temp}°C, ${data.weather[0].description}`;
}

function saveLocation(type, name, pos) {
  const markers = JSON.parse(localStorage.getItem(type)) || [];
  markers.push({ name, pos });
  localStorage.setItem(type, JSON.stringify(markers));
}

ymaps.ready(init);

function init() {
  const map = new ymaps.Map("map", {
    center: [55.7455, 37.62045],
    zoom: 9,
    controls: ["routeButtonControl"]
  });

  document.getElementById("markerForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const search = document.getElementById("searchInput").value;
    const geocoder = ymaps.geocode(search);
    
    geocoder.then(async (res) => {
      const coords = res.geoObjects.get(0).geometry.getCoordinates();
      const weather = await getWeather(coords[0], coords[1]);
      const placemark = new ymaps.Placemark(coords, {
        hintContent: search,
        balloonContent: `${search} <br> Погода: ${weather}`
      });
      map.geoObjects.add(placemark);
      saveLocation("markers", search, coords);
    });
  });

  function loadMarkers() {
    const savedMarkers = JSON.parse(localStorage.getItem("markers")) || [];
    savedMarkers.forEach(async (marker) => {
      const weather = await getWeather(marker.pos[0], marker.pos[1]);
      const placemark = new ymaps.Placemark(marker.pos, {
        hintContent: marker.name,
        balloonContent: `${marker.name} <br> Погода: ${weather}`
      });
      map.geoObjects.add(placemark);
    });
  }
  
  loadMarkers();

  function deleteMarkers() {
    localStorage.removeItem("markers");
    location.reload();
  }
  window.deleteMarkers = deleteMarkers;
}
