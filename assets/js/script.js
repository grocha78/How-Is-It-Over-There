// GIVEN a weather dashboard with form inputs
// WHEN I search for a city
// THEN I am presented with current and future conditions for that city and that city is added to the search history
// WHEN I view current weather conditions for that city
// THEN I am presented with the city name, the date, an icon representation of weather conditions, the temperature, the humidity, the wind speed, and the UV index
// WHEN I view the UV index
// THEN I am presented with a color that indicates whether the conditions are favorable, moderate, or severe
// WHEN I view future weather conditions for that city
// THEN I am presented with a 5-day forecast that displays the date, an icon representation of weather conditions, the temperature, the wind speed, and the humidity
// WHEN I click on a city in the search history
// THEN I am again presented with current and future conditions for that city

var searchInputEl = $("#search-input");
var searchButtonEl = $("#search-button");
var searchHistoryEl = $("#search-history");
var historyItemEl = $(".history-item");
var currentDayEl = $("#current-day");
var weatherDataEl = $("#weather");
var forecastEl = $("#forecast");

var currentHistory = [];

var apiKey = "b80c9210dcc405f9b554e52cbebe68ee";

// Primary weather call
function getWeather(lat, lon, city) {
  let apiUrl = "https://api.openweathermap.org/data/2.5/onecall?lat=" + lat + "&lon=" + lon + "&exclude=minutely,hourly&units=imperial&appid=" + apiKey;

  fetch(apiUrl).then(function(response) {
    if(response.ok){
      response.json().then(function(data){
        // calculate and format today's date
        var currentDate = new Date(data.daily[0].dt * 1000);
        var day = currentDate.getDate();
        var month = currentDate.getMonth() +1;
        var year = currentDate.getFullYear();
        var date = month + "/" + day + "/" + year;
        // adds current day element and info
        currentDayEl.addClass("border border-info bg-info w-100");
        currentDayEl.append(
          `<h2 class='mb-2 mt-1 align-bottom' id='city'>${city} ${date} <img class='icon align-middle' src='http://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png' alt='${data.current.weather[0].description}' /></h2>
          <p id='temp'>Temp: ${data.current.temp}&#176F</p>
          <p id='wind'>Wind speed: ${data.current.wind_speed} MPH</p>
          <p id='humidity'>Humidity: ${data.current.humidity}%</p>
          <p id='uv-index'>UV Index: <span class='bg-info rounded text-white'>${data.current.uvi}</span></p>`
          );

        // shades uv index based on current EPA categories (at time of coding)
        if(data.current.uvi < 3) {
          $("p").find("span").removeClass("bg-info").addClass("low");
        } else if (data.current.uvi >= 3 && data.current.uvi < 6) {
          $("p").find("span").removeClass("bg-info").addClass("moderate");
        } else if (data.current.uvi >= 6 && data.current.uvi < 8) {
          $("p").find("span").removeClass("bg-info").addClass("high");
        } else if (data.current.uvi >= 8 && data.current.uvi < 11) {
          $("p").find("span").removeClass("bg-info").addClass("very-high");
        } else {
          $("p").find("span").removeClass("bg-info").addClass("extreme");
        }

        // adds forecast elements and info
        forecastEl.addClass("w-100 mt-3");
        forecastEl.append(
          `<h2 class='mb-1'>5-Day Forecast:</h2>
            <div class="row justify-content-between" id="forecast-cards">`
          );
        
        var forecastCardEl = $("#forecast-cards");
        
        // loops through the first 5 (skipping one as it is the current day) forecast items and populates data
        for(var i=1; i<6; i++) {
          let forecastDate = new Date(data.daily[i].dt * 1000);
          let forecastDay = forecastDate.getDate();
          let forecastMonth = forecastDate.getMonth() + 1;
          let forecastYear = forecastDate.getFullYear();
          let forecastFormattedDate = forecastMonth+"/"+forecastDay+"/"+forecastYear;

          forecastCardEl.append(
            `<div class="card col-12 col-md-2 rounded-0 text-body bg-info m-2 pb-2">
              <h3 class='mt-1 mb-1'>${forecastFormattedDate}</h3>
              <img class='icon' src='http://openweathermap.org/img/wn/${data.daily[i].weather[0].icon}@2x.png' alt='${data.daily[i].weather[0].description}' />
              <p class='mb-1'>Temp: ${data.daily[i].temp.max}&#176F</p>
              <p class='mb-1'>Wind: ${data.daily[i].wind_speed} MPH</p>
              <p class='mb-1'>Humidity: ${data.daily[i].humidity}%</p>
            </div>`
          );
        }
      })
    } else {
      document.location.replace(".index.html");
    }
  })
}

// Convert city in search to latitude and longitude coordinates.
function getCoordinates(city) {
  let apiUrl = "https://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=1&appid=" + apiKey;

  fetch(apiUrl).then(function(response){
    if(response.ok){
      response.json().then(function(city) {
        getWeather(city[0].lat, city[0].lon, city[0].name);
      })
    }
  })
}

function search(searchHistory) { 
  let city = "";

  if(!searchHistory) {
    function toTitleCase(str) {
      let lower = str.toLowerCase();
      return lower.replace(/(?:^|\s)\w/g, function(match){
        return match.toUpperCase();
      })
    };

    city = toTitleCase($(searchInputEl).val().trim());

    if(city==="") {
      return;
    } else if(currentHistory.includes(city,0)) {
      // do nothing and continue with search
    } else {
      currentHistory.push(city);
      localStorage.setItem("search",JSON.stringify(currentHistory));
    }
  } else {
    city = searchHistory.trim();
  }

  getCoordinates(city);

  searchInputEl.val("");
};

// Populates search history column
function renderSearchHistory() {
  searchHistoryEl.empty();

  for(var i=0;i<currentHistory.length;i++) {
    searchHistoryEl.prepend("<button type='submit' class='history-item mb-3 btn rounded bg-success w-100 font-weight-bold'>" + currentHistory[i] + "</button>");
  }
}

// Loads search history, if it exists, and writes to page
function loadStorage() {
  var searchHistory = localStorage.getItem("search");

  if(!searchHistory) {
    return false;
  }

  currentHistory=JSON.parse(searchHistory);

  for(var i=0; i<currentHistory.length; i++) {
    searchHistoryEl.prepend("<button type='submit' class='history-item mb-3 btn rounded bg-success w-100 font-weight-bold'>" + currentHistory[i] + "</button>");
  }
}

// removes necessary elements before running subsequent search
// Converts search to title case and stores in localStorage before passing to getCoordinates()
$(searchButtonEl).on("click",searchInputEl,function(){
  currentDayEl.children("*").remove();
  forecastEl.children("*").remove();
  search();
  renderSearchHistory();
});

//search on history item when clicked
//do not log entry to search history as it already exists there
$(searchHistoryEl).on("click", function(event){
  var historySearchTerm = event.target.textContent;
  currentDayEl.children("*").remove();
  forecastEl.children("*").remove();
  search(historySearchTerm);
});

loadStorage();