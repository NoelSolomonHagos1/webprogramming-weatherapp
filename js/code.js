document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("weather_btn").addEventListener("click", async function() {

    const addCityButton = document.getElementById("weather_btn");

    
    const city = document.getElementById("input").value;

    if(!city){
        console.log("City invalid or not given");
        return
    }

    const units = document.getElementById("unit-id").value
    const apiKey = "a5f073c283b1a84a13ec5b4f90793a7f";

    let url;

    if (units === "kelvin") {
        url =`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&lang=en`;
    }else {
        url =`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}&lang=en`
    }
    

    const res = await fetch(url);
    const data = await res.json();
    console.log(data);

    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&current=wind_speed_10m,rain`;

    const res2 = await fetch(openMeteoUrl);
    const data2 = await res2.json();

    console.log("rain, wind, uv", data2);

    const currWind = data2.current.wind_speed_10m;
    const currRain = data2.current.rain;
    const uV = data2.daily.uv_index_max[0];

    const windToMeter = ((data2.current.wind_speed_10m)/3.6).toFixed(1);
    


    //console.log(new Date());

    const realTime = Math.floor(new Date().getTime() / 1000)
    const rise = data.sys.sunrise
    const set = data.sys.sunset
    const nightTime = realTime<rise|| realTime > set;


    weatherColors(temp, nightTime);

    const the_weather = document.getElementById("weather-now");

    the_weather.innerHTML="";

    let unit_s;

    if(units === "metric") {
        unit_s = "°C";
    }else if(units === "imperial") {
        unit_s = "°F";
    } else {
        unit_s = "K";
    }

    the_weather.innerHTML = `
        <p>City: ${city}</p>
        <p>Temperature: ${temp} ${unit_s}</p>
        <p>Weather: ${desc}</p>
        <p>Current wind speed: ${windToMeter} m/s</p>
        <p>Rain: ${currRain} mm </p>
        <p>UV Index: ${uV}</p>
    `;

    if(uV>=6) {
        the_weather.innerHTML += `<p style="color:red;">UV index is high, sunscreen is advisable!</p>`;
    } 

    await fetchWeek(lat, lon, units);
    forecast24hr(lat, lon, units);

    });

    document.getElementById("own-location").addEventListener("click", function() {
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser")
        return;
    }

    navigator.geolocation.getCurrentPosition(async function(position) {
        const lat = position.coords.latitude
        const lon = position.coords.longitude;
        const units = document.getElementById("unit-id").value;
        const apiKey = "a5f073c283b1a84a13ec5b4f90793a7f";

        let url;
        if (units === "kelvin") {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=en`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}&lang=en`;
        }

        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
    

        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        const city = data.name;

        const realTime = new Date().getTime()/1000;
        const nightTime = realTime<data.sys.sunrise || realTime > data.sys.sunset;
        weatherColors(temp, nightTime);

        let unit_s;

        if(units === "metric") {
            unit_s = "°C";
        }else if(units === "imperial") {
            unit_s = "°F";
        }else {
            unit_s = "K";
        }
        const the_weather = document.getElementById("weather-now");
        
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&current=wind_speed_10m,rain`;

        const res2 = await fetch(openMeteoUrl);
        const data2 = await res2.json();

        const currWind = data2.current.wind_speed_10m;
        const currRain = data2.current.rain;
        const uV = data2.daily.uv_index_max[0];

        const windToMeter = ((data2.current.wind_speed_10m)/3.6).toFixed(1);

        
        the_weather.innerHTML = "";
        the_weather.innerHTML = `
            <p>City: ${city}</p>
            <p>Temperature: ${temp} ${unit_s}</p>
            <p>Weather: ${desc}</p>
            <p>Current wind speed: ${windToMeter} m/s</p>
            <p>Rain: ${currRain} mm</p>
            <p>UV Index: ${uV}</p>

        `;

        if(uV>=6) {
            the_weather.innerHTML += `<p style="color:red;">UV index is high, sunscreen is advisable!</p>`;
        } 

        await fetchWeek(lat, lon, units);
        forecast24hr(lat, lon, units);

    });
    });

    async function fetchWeek(lat, lon, units) {
    //console.log("check if unction is working");
    const apiKey = "a5f073c283b1a84a13ec5b4f90793a7f";

    let unit_s;
    if (units === "metric") {
        unit_s = "°C";
    } else if (units === "imperial") {
        unit_s = "°F";
    } else {
        unit_s = "K";
    }

    let uP;
    if (units === "kelvin") {
        uP = "";
    } else {
        uP = `&units=${units}`;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}${uP}&appid=${apiKey}&lang=en`;


    const response = await fetch(url);
    const data = await response.json();
    //console.log(data);

    const today = new Date().toISOString().split("T")[0];

    
    //The whole next block of code (while loop) I looked from various different websites and also asked AI to teach me use it(
    const dailyCasts = data.list.filter(forecast => forecast.dt_txt.includes("12:00:00") && !forecast.dt_txt.startsWith(today));
    
    while (dailyCasts.length < 7) {
        const last = dailyCasts[dailyCasts.length - 1];
        const newDate = new Date(last.dt * 1000);
        newDate.setDate(newDate.getDate() + 1);

        const createdCast = { ...last };
        createdCast.dt = Math.floor(newDate.getTime() / 1000);
        createdCast.dt_txt = newDate.toISOString().split("T")[0] + " 12:00:00";

        dailyCasts.push(createdCast);
        //console.log(dailyCasts);
    }
    //)

    let data_html = `<h2>7 Day Forecast</h2><div class="forecastPlacer">`;
    dailyCasts.slice(0, 7).forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        const temp = Math.round(forecast.main.temp);
        const weatherDesc = forecast.weather[0].description;
        const icon = forecast.weather[0].icon;

        data_html += `
            <div class="forecastBox">
                <p><strong>${date}</strong></p>
                <p><img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${weatherDesc}"></p>
                <p>Temperature: ${temp} ${unit_s}</p>
                <p>${weatherDesc}</p>
            </div>
        `;
    });

    data_html+=`</div>`;

    const weatherWeek = document.getElementById("weather-week");

    weatherWeek.innerHTML="";
    weatherWeek.innerHTML += data_html;
    }

    document.getElementById("favorite-btn").addEventListener("click", function() {
        const city = document.getElementById("input").value.trim();

        if(city === ""){
            return;
        }

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
        if(!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem("favorites", JSON.stringify(favorites));
            addToFavorites();
        }
    })

    function addToFavorites() {
        const favoriteList = document.getElementById("favorite-list"); //creating the favorite list
        favoriteList.innerHTML = "";

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        favorites = favorites.filter(city => city !== ""); //For erasing the random empty line in the list (2nd)

        favorites.forEach(city => {
        
            const the_list = document.createElement("li");
            the_list.textContent = city;
    
            the_list.addEventListener("click", () => {
                document.getElementById("input").value = city;
                document.getElementById("weather_btn").click();
            });

            favoriteList.appendChild(the_list);
        })
    }

    function weatherColors(temp, nightTime) {
    const body = document.body;
    body.className="";

    if (nightTime) {
        body.classList.add("night");
    } else if (temp < 10) {
        body.classList.add("cold");
    } else if (temp >= 10 && temp <= 25) {
        body.classList.add("warm");
    } else {
        body.classList.add("hot");
    }
    }

    async function forecast24hr(lat, lon, units) {
        const apiKey = "a5f073c283b1a84a13ec5b4f90793a7f";

        let unit_s;
        if (units === "metric") {
            unit_s = "°C";
        } else if (units === "imperial") {
            unit_s = "°F";
        } else {
            unit_s = "K";
        }

        let uP;
        if (units === "kelvin") {
            uP = "";
        } else {
            uP = `&units=${units}`;
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}${uP}&appid=${apiKey}&lang=en`;

        const response = await fetch(url);
        const data = await response.json();
        console.log("Data we're working with", data);

        const dayCast = data.list.slice(0,9) //0,8 because of 3h dlay in free version of openweather
        console.log(dayCast);

        let data_html = `<h2>24h Forecast</h2><div class="forecastPlacer">`;
        dayCast.forEach(data => {
            const time = data.dt_txt;
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            const icon = data.weather[0].icon;
    

            data_html += `
                <div class="forecastBox">
                    <p><strong>${time}</strong></p>
                    <p><img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}"></p>
                    <p>Temperature: ${temp} ${unit_s}</p>
                    <p>${desc}</p>
                </div>
            `;

        });
        data_html+=`</div>`;

        const weather24h = document.getElementById("weather-24h");

        if (!weather24h) {
            console.error("weather-24h element not found");
            return;
        }

        weather24h.innerHTML="";
        weather24h.innerHTML+=data_html;
    }
    addToFavorites();
});
