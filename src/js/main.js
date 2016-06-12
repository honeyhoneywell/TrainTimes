var stations = [];

fetch("https://huxley.apphb.com/crs").then(function(response) {
  return response.json();
}).then(function(data) {
  data.map(x => stations.push(x.stationName));
  stations = stations.map(x => x.toLowerCase());
});

var getTrains = (from, to) => {
  var url = 'https://huxley.apphb.com/departures/'+from+'/to/'+to+'?accessToken=3bb783d8-9df4-4be0-98bb-c25d56f391fd';
  fetch(url).then(function(response){
    return response.json();
  }).then(function(data){
    console.log(data);
  });
}

var departureStationLookup = () => {
  document.getElementById('departureSuggestions').innerHTML = '';
  var input = document.getElementById('departure').value;
  input = input.toLowerCase();
  var suggestions = stations.filter(x => x.match(input));
  if (suggestions.length < 6) {
    suggestions.map(x => document.getElementById('departureSuggestions').innerHTML += '<div class="suggestion">' + x + '</div><br>');
  }
}

var destinationStationLookup = () => {
  document.getElementById('destinationSuggestions').innerHTML = '';
  var input = document.getElementById('destination').value;
  input = input.toLowerCase();
  var suggestions = stations.filter(x => x.match(input));
  if (suggestions.length < 6) {
    suggestions.map(x => document.getElementById('destinationSuggestions').innerHTML += '<div class="suggestion">' + x + '</div><br>');
  }
}
