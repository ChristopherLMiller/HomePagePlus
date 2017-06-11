$("#modal").animatedModal({
    modalTarget: 'optionsModal',
    animatedIn:'lightSpeedIn',
    animatedOut:'bounceOutDown',
    color: '#40793e'
});

var iconShowing;
var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

$(document).ready(function() {
    // load settings
    loadSettings();

    extensionManifest = chrome.runtime.getManifest();
    $('#version').text('v'+ extensionManifest.version);
    updateClock();

    getGeolocation();
    
    // get the quote
    getQuote();

    handleOptionsModal();

    //$.getJSON('https://www.reddit.com/r/earthporn.json', getImages, 'jsonp');

    $('#digital_clock').bind('click', function() {
        if (clockToggle && clockType === "digital") {
            clockFormat = (clockFormat == 12) ? 24 : 12;
            updateClock();
        }
    });

    // handle refresh click
    $('#refresh').bind('click', function() {
        getQuote();
    });

    // flipper container click trigger
    $('.flipper-container').bind('click', function() {
        $('.flipper-container').toggleClass('flip');
    });



    $('#save_settings').bind('click', function() {
        weatherAppId = $('#weatherAppId').val();
        saveSettings();
        $('.close-optionsModal').click();
        getWeather();
    });

    // handle search box
    $('#search_button').bind('click', search);
    $('#search_input').on('keydown', function(e) {
        if (e.which == 13 || e.keycode == 13) {
            search();
        }
    });

    // set intervals, done last to allow other stuff to load, not crucial to be executed immediately
    setInterval(function() {
        $('.flipper-container').toggleClass('flip');
    }, 1000*30);
    setInterval('updateClock()', 1000);
    setInterval('getQuote()', 1000*60*5);
    setInterval('getWeather()', 100*60*15); // fifteen minutes

    if (!navigator.onLine) {
        setTimeout(displayWeather, 2000);
    }
});

var search = function() {
    var searchTerm = $('#search_input').val();
    $('#search_input').val('');
    if (searchTerm) {
        switch (searchEngine) {
            case 'Google':
                window.location.href = 'http://google.com/search?q=' + searchTerm;
                break;
            case 'Bing':
                window.location.href = 'http://bing.com/search?q=' + searchTerm;
                break;
            case 'Yahoo!':
                window.location.href = 'https://search.yahoo.com/search?p=' + searchTerm;
                break;
        }
    }
}

var loadSettings = function() {
    chrome.storage.sync.get({
        searchEnable: true,
        searchEngine: 'Google',
        quoteEnable: true,
        optionsColor: '#40793e',
        navColor: '#6d4c2e',
        navLinks: ['facebook'],
        clockEnable: true,
        clockFormat: '12',
        clockToggle: false,
        clockType: 'digital',
        weatherEnable: true,
        weatherUnits: 'F',
        weatherTimestamp: 0,
        weather: {},
        weatherAppId: null,
        geolocation: {},
    },
    function(items) {
        console.log(items);
        $('#searchEnable').attr('checked', searchEnable = items.searchEnable);
        $('#searchEngine').val(searchEngine = items.searchEngine);
        $('#quoteEnable').attr('checked', quoteEnable = items.quoteEnable);
        $('#optionsColor').val(optionsColor = items.optionsColor);
        $('#navColor').val(navColor = items.navColor);
        $('#navLinks').val(navLinks = items.navLinks);
        $('#clockEnable').attr('checked', clockEnable = items.clockEnable);
        $('#clockFormat').val(clockFormat = items.clockFormat);
        $('#clockToggle').attr('checked', clockToggle = items.clockToggle);
        $('#clockType').val(clockType = items.clockType);
        $('#weatherEnable').attr('checked', weatherEnable = items.weatherEnable);
        $('#weatherUnits').val(weatherUnits = items.weatherUnits);
        $('#weatherAppId').val(weatherAppId = items.weatherAppId);
        weatherTimestamp = items.weatherTimestamp;
        geolocation = items.geolocation;
        weather = items.weather;
        updateUI();
    });
};

var saveSettings = function() {
    chrome.storage.sync.set({
        searchEnable,
        searchEngine,
        quoteEnable,
        optionsColor,
        navColor,
        navLinks,
        clockEnable,
        clockFormat,
        clockToggle,
        clockType,
        weatherEnable,
        weatherUnits,
        weatherAppId
    },
    function() {
        $.amaran({
            'theme'     :'colorful',
            'content'   :{
                bgcolor:'#27ae60',
                color:'#fff',
                message:'Settings saved successully',
            },
            'position'  :'bottom right',
            'outEffect' :'slideBottom'
        });
    });
}

var saveTimestamp = function() {
    chrome.storage.sync.set({
        weatherTimestamp
    });
}

var saveLocation = function() {
    chrome.storage.sync.set({
        geolocation
    });
}

var saveWeather = function() {
    chrome.storage.sync.set({
        weather
    });
}

var handleOptionsModal = function() {

    $('#searchEnable').bind('click', function() {
        searchEnable = $("#searchEnable").prop('checked');
        updateUI();
    });

    $('#searchEngine').bind('click', function() {
        searchEngine = $('#searchEngine').val();
        updateUI();
    });

    $('#quoteEnable').bind('click', function() {
        quoteEnable = $("#quoteEnable").prop('checked');
        updateUI();
    });

    $('#optionsColor').on('change', function() {
        optionsColor = $('#optionsColor').val();
        updateUI();
    });

    $('#navColor').on('change', function() {
        navColor = $('#navColor').val();
        updateUI();
    });

    $('#navLinks').on('change', function() {
        navLinks = $('#navLinks').val();
        updateUI();
    });

    $('#clockEnable').bind('click', function() {
        clockEnable = $('#clockEnable').prop('checked');
        updateUI();
    });

    $('#clockFormat').bind('click', function() {
        clockFormat = parseInt($('#clockFormat').val());
    });

    $('#clockToggle').bind('click', function() {
        clockToggle = $('#clockToggle').is(':checked');

        // if toggling isn't allowed, reset the clockFormat to that of what was configured
        clockFormat = parseInt($('#clockFormat').val());
    });

    $('#clockType').bind('click', function() {
        clockType = $('#clockType').val();
        updateUI();
    });

    $('#weatherEnable').bind('click', function() {
        weatherEnable = $('#weatherEnable').prop('checked');
        updateUI();
    });

    $('#weatherUnits').bind('click', function() {
        weatherUnits = $('#weatherUnits').val();
        getGeolocation();
    });
}

var updateUI = function() {

    // search enabled
    if (searchEnable) {
        $('.search-box').addClass('active');
        $('#searchEngine').parents('div.option_element').addClass('active');
    } else {
        $('.search-box').removeClass('active');
        $('#searchEngine').parents('div.option_element').removeClass('active');
    }

    // update the search box
    $('#search_input').attr('placeholder', 'Search ' + searchEngine + '...');

    // quote enabled
    if (quoteEnable) {
        $('.quote').addClass('active');
    } else {
        $('.quote').removeClass('active');
    }

    // update the color picker parent with respective color
    $('#optionsColor').parents('label.color').css('background', optionsColor);
    $('#optionsModal').css('background', optionsColor);
    $('.modalContainer').css('color', optionsColor);
    $('.modalContainer legend').css('color', optionsColor);
    $('.modalContainer option').css('color', optionsColor);
    $('.modalContainer select').css('color', optionsColor);

    $('#navColor').parents('label.color').css('background', navColor);
    $('nav').css('background', navColor);

    // update the navigation bar
    $('nav').empty();
    navLinks.forEach(function(link) {

        var a = $('<a>').attr('href', $("[value='" + link + "']").data('link')).appendTo($('nav'));
        var i = $('<i>').addClass('fa fa-'+link.toLowerCase()+' fa-4x').appendTo(a);
    });

    // display clock options if the clock element is enabled
    if (clockEnable) {
        $('#clockType').parents('div.option_element').addClass('active');
    } else {
        $('#clockType').parents('div.option_element').removeClass('active');
        $('#clockFormat').parents('div.option_element').removeClass('active');
        $('#clockToggle').parents('div.option_element').removeClass('active');
        $('#analog_clock').removeClass('active');
        $('#digital_clock').removeClass('active');
    }

    // if clock is enabled AND type is digital, show other options
    if (clockEnable && clockType === "digital") {
        $('#digital_clock').addClass('active');
        $('#analog_clock').removeClass('active');
        $('#clockFormat').parents('div.option_element').addClass('active');
        $('#clockToggle').parents('div.option_element').addClass('active');
    } else if (clockEnable && clockType === 'analog'){
        $('#analog_clock').addClass('active');
        $('#digital_clock').removeClass('active');
        $('#clockFormat').parents('div.option_element').removeClass('active');
        $('#clockToggle').parents('div.option_element').removeClass('active');
    }

    // display weather options if weather element is enabled
    if (weatherEnable) {
        $('#weather').addClass('active');
        $('#weatherUnits').parents('div.option_element').addClass('active');
        $('#weatherAppId').parents('div.option_element').addClass('active');
    } else {
        $('#weather').removeClass('active');
        $('#weatherUnits').parents('div.option_element').removeClass('active');
        $('#weatherAppId').parents('div.option_element').removeClass('active');
    }
};

var getQuote = function() {
    $.ajax({
        method: 'get',
        type: 'json',
        url: 'https://andruxnet-random-famous-quotes.p.mashape.com/?cat=famous',
        headers: {
            'X-Mashape-Key': 'fdsv5ceSE2mshy4trzTyQNdsdh7rp1L6vaNjsnlfpuequ1zlJl'
        },
        success: function(data) {
            setQuote(data.quote, data.author);
        },
        error: function() {
            setQuote('Well done is better than well said.', 'Benjamin Franklin');
        }
    });
}

var setQuote = function(text, author) {
    $("#quote-text").text(text);

    if (author === '') {
        author = 'Unknown';
    }
    $("#quote-author").text(author);

};

var getGeolocation = function() {
    navigator.geolocation.getCurrentPosition(function(data) {
        geolocation.coords = {
            'lat': data.coords.latitude,
            'long': data.coords.longitude
        };
        saveLocation();
        getCityName();
    });
}

var getCityName = function() {

    if (navigator.onLine) {
        $.ajax({
            url: 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + geolocation.coords.lat + ',' + geolocation.coords.long +'&sensor=true',
            success: function(results) {
                $.each(results.results[0].address_components, function(i, address_component) {
                    if (address_component.types.includes("locality")) {
                        city = address_component.long_name;
                    } else if (address_component.types.includes("administrative_area_level_1")) {
                        state = address_component.short_name;
                    }
                });

                geolocation.place = city + ', ' + state; 
                saveLocation();
            },
            complete: function(xhr, status) {
                getWeather();
            }
        });
    } else {
        getWeather();
    }
    
}

var getWeather = function() {
    console.log('Updating weather');

    currentTimestamp = + new Date();
    if ( (currentTimestamp > weatherTimestamp + 600000) || $.isEmptyObject(weather) ) {
        weatherTimestamp = + new Date();
        saveTimestamp();

        if (navigator.onLine) {
            // get the current weather
            $.ajax({
                url: `http://api.openweathermap.org/data/2.5/weather?lat=${geolocation.coords.lat}&lon=${geolocation.coords.long}&appid=${weatherAppId}`,
                success: function(results) {
                    if (weatherEnable) {
                        $("#weather").addClass('active');
                    }
                    weather = {
                        temp: results.main.temp,
                        icon: results.weather[0].id,
                        wind: {
                            deg: results.wind.deg,
                            speed: results.wind.speed
                        },
                        sunrise: results.sys.sunrise,
                        sunset: results.sys.sunset
                    }
                },
                error: function(xhr, status, errorThrown) {
                    if (xhr.status == "401") {
                        $.amaran({
                            'theme'     :'colorful',
                            'content'   :{
                                bgcolor:'#f44b42',
                                color:'#fff',
                                message:'Unable to fetch weather.  Please provide API key in settings.',
                            },
                            'position'  :'bottom right',
                            'outEffect' :'slideBottom'
                        });

                        // hide the weather card
                        $("#weather").removeClass("active");
                    }
                }
            });

            // get the 3 day forecast information
            $.ajax({
                url: `http://api.openweathermap.org/data/2.5/forecast/daily?cnt=3&lat=${geolocation.coords.lat}&lon=${geolocation.coords.long}&appid=${weatherAppId}`,
                success: function(results) {
                    console.log(results);
                    // loop through the 3 days worth of data, pulling out the high temp for each day
                    let three_day = [];
                    results.list.forEach(function(element) {

                        // push both the temp and the icon
                        three_day.push({
                            'temp': element.temp.max,
                            'icon': element.weather[0].id,
                            'timestamp': element.dt,
                        });
                    });

                    weather.forecast = three_day;
                }
            });
            saveWeather();
            displayWeather();
        } else {
            displayWeather();
        }
    } else {
        // weather doesn't need refreshed, just display it
        displayWeather();
    }
}

var displayWeather = function() {
    $("#location").text(geolocation.place);

    var currentTime = + new Date()

    if (currentTime/1000 >= weather.sunrise && currentTime/1000 <= weather.sunset) {
        $('#icon').addClass('owf-'+weather.icon+"-d");
    } else {
        $('#icon').addClass('owf-'+weather.icon+'-n');
    }
    $('#icon').addClass('animated fadeIn');
    if (weatherUnits === 'F') {
        $("#temperature").text(Math.round((weather.temp * (9/5) - 459.67)));
    } else {
        $("#temperature").text(Math.round(weather.temp - 273.15));
    }
    $('#wind').addClass('wi-wind').addClass('from-'+weather.wind.deg+'-deg');

    // back card - 3 day
    for (var i = 1; i <= 3; i++) {
        forecastItem(i);
    }

    iconShowing = true;
    setInterval('toggleForecast()', 1000*5);
};

var forecastItem = function(num) {
    let date = new Date(weather.forecast[num-1].timestamp*1000);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    $('#' + num + ' span').text(days[date.getDay()]);
    $('#' + num + ' i').addClass('active owf owf-'+weather.forecast[num-1].icon+'-d');
    if (weatherUnits === 'F') {
        $('#' + num + ' p').text(Math.round( (weather.forecast[num-1].temp * (9/5) - 459.67) ));
    } else {
        $('#' + num + ' p').text(Math.round( weather.forecast[num-1].temp - 273.15));
    }
};

var toggleForecast = function() {
        iconShowing = !iconShowing;

        var elements = [];
        for (var i = 0; i < 3; i++) {
            elements.push($('#' + (i+1)));
        }

        elements.forEach(function(element) {
            if (iconShowing) {
                element.find('p').addClass('animated fadeOut').one(animationEnd, function() {
                    element.find('p').removeClass('animated fadeOut').removeClass('active');
                    element.find('i').addClass('active').addClass('animated fadeIn').one(animationEnd, function() {
                        element.find('i').removeClass('animated fadeIn');
                    })
                });
            } else  {
                element.find('i').addClass('animated fadeOut').one(animationEnd, function() {
                    element.find('i').removeClass('animated fadeOut').removeClass('active');
                    element.find('p').addClass('active').addClass('animated fadeIn').one(animationEnd, function() {
                        element.find('p').removeClass('animated fadeIn');
                    })
                });
            }
        });
};

var updateClock = function() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    sdeg = (seconds/60) * 360;
    mdeg = ((minutes/60) * 360) + (seconds/60);
    hdeg = ((hours/12)  * 360) + ((minutes/60) * 30); // 30 degrees per hour



    minutes =  minutes < 10 ? "0" + now.getMinutes() : now.getMinutes()
    // account for 12/24 hour setting
    if (clockFormat == 12) {
        hours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours();
            // account for midnight, shows as 0 o'clock
        if (now.getHours() == 0) hours = 12;
    } else {
        hours =now.getHours();
    }

    $('#digital_clock h1').text(hours + ":" + minutes);
    $('.second').css('transform', 'rotate('+sdeg+'deg)');
    $('.minute').css('transform', 'rotate('+mdeg+'deg)');
    $('.hour').css('transform', 'rotate('+hdeg+'deg)');
};
