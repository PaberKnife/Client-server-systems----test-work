$(document).ready(function() {
  $.ajax({
    // Ajax-запрос для получения всех доступных регионов:
    url: 'http://localhost:3000/stop_areas',
    type: 'GET',
    dataType: 'json',
    success: function(regions) {
      var select = $('#region-select');
      var defaultOption = $('<option>').val('DEFAULT').text('Valige asukoht');
      select.append(defaultOption);
      for (var i = 0; i < regions.length; i++) {
        if(!regions[i].stop_area) regions[i].stop_area = " ";
        var option = $('<option>').val(regions[i].stop_area).text(regions[i].stop_area === ' ' ? 'Muud' : regions[i].stop_area);
        select.append(option);
      var otherOption = $('#region-select option[value=" "]');
      otherOption.remove();
      select.append(otherOption);
      }

      // Event listener для элемента region-select:
      $('#region-select').on('change', function() {
        var selectedRegion = this.value;
        if (selectedRegion === 'DEFAULT') {
          var select = $('#stop-select');
          var busList = $('#bus-list');
          var departureList = $('#departure-list');
          select.empty();
          select.prop('disabled', true);
          busList.empty();
          busList.prop('disabled', true);
          departureList.empty();
          departureList.prop('disabled', true);
        } else {
        // Ajax-запрос для получения информации об автобусных остановках для выбранного региона:
          $.ajax({
            url: 'http://localhost:3000/stop_info',
            type: 'GET',
            dataType: 'json',
            data: { region: selectedRegion },
            success: function(stops) {
              var select = $('#stop-select');
              var busList = $('#bus-list');
              var departureList = $('#departure-list');
              select.empty();
              busList.empty();
              departureList.empty();
              var defaultOption = $('<option>').val('DEFAULT').text('Valige peatus');
              select.append(defaultOption);
              select.prop('disabled', false);
              for (var i = 0; i < stops.length; i++) {
                var option = $('<option>').val(stops[i].stop_id).text(stops[i].stop_name + ' (' + stops[i].stop_code + ')');
                select.append(option);
              }
            }
          });
        }
      });

      // Event listener для элемента stop-select:
      $('#stop-select').on('change', function() {
        var selectedStopId = this.value;
        if (selectedStopId === 'DEFAULT') {
          var busList = $('#bus-list');
          var departureList = $('#departure-list');
          busList.empty();
          busList.prop('disabled', true);
          departureList.empty();
          departureList.prop('disabled', true);
        } else {
        $('#bus-list').empty();
        $('#bus-list').prop('disabled', false);
        $('#departure-list').empty();
        $('#bus-list').append($('<option>').text('Laadimine...'));
        // Ajax-запрос для получения автобусных номеров на выбранной остановке:
          $.ajax({
            url: 'http://localhost:3000/route_short_names',
            type: 'GET',
            dataType: 'json',
            data: { stop_id: selectedStopId },
            success: function(buses) {
              buses = buses.map(function(bus) {
                return bus.route_short_name;
              });
              buses.sort(function (a, b) {
                var aNum = parseInt(a.replace(/[^0-9]/g, ''));
                var bNum = parseInt(b.replace(/[^0-9]/g, ''));
                if (aNum !== bNum) {
                    return aNum - bNum;
                }
                return a.localeCompare(b);
              });
              var busList = $('#bus-list');
              var departureList = $('#departure-list');
              busList.empty();
              busList.prop('disabled', false);
              departureList.empty();
              departureList.prop('disabled', false);
              for (var i = 0; i < buses.length; i++) {
                var option = $('<option>').text(buses[i]);
                busList.append(option);
              }
              if (buses.length === 0) {
                var option = $('<option>').val('DEFAULT').text('Midagi ei leitud.');
                departureList.prop('disabled', true);
                busList.append(option);
              } 
            }
          });
        }
      });

      // Event listener для элемента bus-list:
      $('#bus-list').on('change', function() {
        var selectedBus = this.value;
        var selectedStopId = $('#stop-select').val();
        if (selectedStopId === 'DEFAULT' || selectedBus === 'DEFAULT') {
          var departureList = $('#departure-list');
          departureList.empty();
          departureList.prop('disabled', true);
        } else {
          $('#departure-list').empty();
          $('#departure-list').prop('disabled', false);
          $('#departure-list').append($('<option>').text('Laadimine...'));
          // Ajax-запрос для получения информации о маршрутах для выбранного автобуса:
          $.ajax({
            url: 'http://localhost:3000/stop_times',
            type: 'GET',
            dataType: 'json',
            data: { route_short_name: selectedBus, stop_id: selectedStopId },
            success: function(departures) {
              var currentDate = new Date();
              var departureList = $('#departure-list');
              departureList.empty();
              for (var i = 0; i < departures.length; i++) {
                var departureTime = new Date(currentDate.getFullYear() + '-' + (currentDate.getMonth()+1) + '-' + currentDate.getUTCDate() + ' ' + departures[i].departure_time);
                if (departureTime < currentDate) {
                  departureTime.setUTCDate(departureTime.getUTCDate() + 1);
                }
                var departure = departureTime.toLocaleString();
                var option = $('<option>').text(departure + ', ' + departures[i].trip_long_name);
                departureList.append(option);
              }
              if (departures.length === 0) {
                var option = $('<option>').text('Midagi ei leitud.');
                departureList.append(option);
              } else {
                $('#departure-list option').sort(function(a, b) {
                  var dateA = a.text.split(', ')[0].split('.').reverse().join('') + a.text.split(', ')[1].split(':').join('');
                  var dateB = b.text.split(', ')[0].split('.').reverse().join('') + b.text.split(', ')[1].split(':').join('');
                  return dateA - dateB;
                }).appendTo('#departure-list');
              }
            }
          });
        }
      });
    }
  });

  // Event listener для элемента geolocation-btn (кнопка, отвечающая автоматическое определение географического положения пользователя):
  document.getElementById("geolocation-btn").addEventListener("click", function(event) {
    event.preventDefault();
    // Проверка, поддерживает ли браузер геолокацию:
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        // Получение текущей широты и долготы пользователя:
        var userLat = position.coords.latitude;
        var userLon = position.coords.longitude;
        // ajax-запрос для получения информации о ближайшей автобусной остановке:
        $.ajax({
          url: 'http://localhost:3000/nearest_stops',
          type: 'GET',
          dataType: 'json',
          data: { lat: userLat, lon: userLon },
          success: function(data) {
            // Обновление элемента region-select:
            $('#region-select').val(data.stop_area);
            $("#region-select").change();
            setTimeout(function() {
              // Обновление элемента stop-select:
              $('#stop-select').val(data.stop_id);
              $("#stop-select").change();
            }, 1000);
          }
        });
      });
    } else {
      // Сообщение об ошибке, если браузер не поддерживает геолокацию:
      alert('See brauser ei toeta geograafilist asukohta.');
    }
  });

  // Event listener для элемента clear-btn (кнопка, очищающая все поля на странице):
  document.getElementById("clear-btn").addEventListener("click", function(event) {
    event.preventDefault();
    $('#region-select').val('DEFAULT');
    $("#region-select").change();
  });
});
