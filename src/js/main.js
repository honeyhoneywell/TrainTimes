let stations = [];
let fromValidStation = false;
let toValidStation = false;
let offlineMode = false;
let currentJourneys = [];
let journey = {};

fetch("https://huxley.apphb.com/crs").then(function(response) {
  return response.json();
}).then(function(data) {
  data.map(x => stations.push(x.stationName));
  stations = stations.map(x => x.toLowerCase());
}).catch(function(error) {
  document.getElementById('title').innerHTML = "<span id='offline'>Offline (May not include latest updates)</span> - UK Train Times";
  offlineMode = true;
  useCachedStationData();
});

var useCachedStationData = () => {
  fetch("/stations.json").then(function(response) {
    return response.json();
  }).then(function(data) {
    data.map(x => stations.push(x.stationName));
    stations = stations.map(x => x.toLowerCase());
  }).catch(function(error) { });
}


var departureStationLookup = () => {
  document.getElementById('error-message').innerHTML = "";
  document.getElementById('departureSuggestions').innerHTML = '';
  var input = document.getElementById('departure').value;
  input = input.toLowerCase();
  if (stations.indexOf(input) > -1) {
    document.getElementById('departure').style.border = "1px solid rgba(25, 210, 25, 0.7)";
    fromValidStation = true;
    if (toValidStation) fetchTrainTimes();
  } else {
    if (offlineMode) fetchTrainTimes();
    document.getElementById('departure').style.border = "1px solid black";
    fromValidStation = false;
    document.getElementById('train-times').innerHTML = '';
  }

  var suggestions = stations.filter(x => x.match(input));
  if (suggestions.length < 11) {
    suggestions.map(x => document.getElementById('departureSuggestions').innerHTML += '<div class="suggested-departure-station" name="'+x+'">' + x + '</div><br>');
  }

  $('.suggested-departure-station').on('click', function() {
    document.getElementById('departure').value = this.getAttribute("name");
    document.getElementById('departureSuggestions').innerHTML = '';
    if (stations.indexOf(document.getElementById('departure').value) > -1) {
      document.getElementById('departure').style.border = "1px solid rgba(25, 210, 25, 0.7)";
      fromValidStation = true;
      if (toValidStation) fetchTrainTimes();
    } else {
      if (offlineMode) fetchTrainTimes();
      document.getElementById('departure').style.border = "1px solid black";
      fromValidStation = false;
      document.getElementById('train-times').innerHTML = '';
    }
  });
}


var destinationStationLookup = () => {
  document.getElementById('error-message').innerHTML = "";
  document.getElementById('destinationSuggestions').innerHTML = '';
  var input = document.getElementById('destination').value;
  input = input.toLowerCase();
  if (stations.indexOf(input) > -1) {
    document.getElementById('destination').style.border = "1px solid rgba(25, 210, 25, 0.7)";
    toValidStation = true;
    if (fromValidStation) fetchTrainTimes();
  } else {
    if (offlineMode) fetchTrainTimes();
    document.getElementById('destination').style.border = "1px solid black";
    toValidStation = false;
    document.getElementById('train-times').innerHTML = '';
  }

  var suggestions = stations.filter(x => x.match(input));
  if (suggestions.length < 11) {
    suggestions.map(x => document.getElementById('destinationSuggestions').innerHTML += '<div class="suggested-destination-station" name="'+x+'">' + x + '</div><br>');
  }

  $('.suggested-destination-station').on('click', function() {
    document.getElementById('destination').value = this.getAttribute("name");
    document.getElementById('destinationSuggestions').innerHTML = '';
    if (stations.indexOf(document.getElementById('destination').value) > -1) {
      document.getElementById('destination').style.border = "1px solid rgba(25, 210, 25, 0.7)";
      toValidStation = true;
      if (fromValidStation) fetchTrainTimes();
    } else {
      if (offlineMode) fetchTrainTimes();
      document.getElementById('destination').style.border = "1px solid black";
      toValidStation = false;
      document.getElementById('train-times').innerHTML = '';
    }
  });
}


var fetchTrainTimes = () => {
  var from = document.getElementById('departure').value;
  var to = document.getElementById('destination').value;
  if (from == to) {
    document.getElementById('error-message').innerHTML = "Please select different stations";
  } else {
    document.getElementById('error-message').innerHTML = "";
    var url = 'https://huxley.apphb.com/departures/'+from+'/to/'+to+'?accessToken=3bb783d8-9df4-4be0-98bb-c25d56f391fd';
    fetch(url).then(function(response){
      return response.json();
    }).then(function(data){
        for (var item in data.trainServices) {
          if (data.trainServices[item].platform == null) {
            data.trainServices[item].platform = '';
          }
        }
        if (data.trainServices == null) {
          document.getElementById('error-message').innerHTML = "No trains between these stations";
        } else {
          currentJourneys = []
          for (let item in data.trainServices) {
            journey = {};
            journey.departure = data.trainServices[item].std;
            journey.operator = data.trainServices[item].operator;
            journey.platform = data.trainServices[item].platform;
            journey.serviceID = data.trainServices[item].serviceID;
            currentJourneys.push(journey);
          }
          document.getElementById('error-message').innerHTML = "";
          document.getElementById('train-times').innerHTML = "<div class='train'><div class='table-row headers'><div class='table-item' >Departure</div><div class='table-item' >Arrival</div><div class='table-item' >Operator</div><div class='table-item' >Platform</div></div></div>";
          data.trainServices.map(x => document.getElementById('train-times').innerHTML += "<div class='train'><div class='table-row'><div class='table-item'>" + x.std + "</div><div class='table-item' id='" + x.serviceID + "'>" + getArrivalTime(x.serviceID) + "</div><div class='table-item'>" + x.operator + "</div><div class='table-item'>" + x.platform + "</div></div></div>");
        }
    }).catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      var dbPromise = idb.open('train-times', 1, function(upgradeDb) { });

      dbPromise.then(db => {
        return db.transaction('trains')
          .objectStore('trains').getAll();
      }).then(function(allObjs){
          for (let item in allObjs) {
            if (allObjs[item].name == `${document.getElementById('departure').value.toLowerCase()}:${document.getElementById('destination').value.toLowerCase()}`) {
              document.getElementById('train-times').innerHTML = "<div class='train'><div class='table-row headers'><div class='table-item' >Departure</div><div class='table-item' >Arrival</div><div class='table-item' >Operator</div><div class='table-item' >Platform</div></div></div>";
              allObjs[item].trains.map(x => document.getElementById('train-times').innerHTML += "<div class='train'><div class='table-row'><div class='table-item'>" + x.departure + "</div><div class='table-item'>" + x.arrival + "</div><div class='table-item'>" + x.operator + "</div><div class='table-item'>" + x.platform + "</div></div></div>");
            }
          }
        }
      );

    });
  }
}


var getArrivalTime = (serviceID) => {
  var url = "https://huxley.apphb.com/service/" + serviceID + "?accessToken=DA1C7740-9DA0-11E4-80E6-A920340000B1";
  var st = "";
  var promise = fetch(url).then(function(response){
    return response.json();
  }).then(function(data){
    var destinations = data.subsequentCallingPoints[0].callingPoint.filter(x => x.locationName.toLowerCase() == document.getElementById('destination').value);
    st = destinations[0].st;
    document.getElementById(serviceID).innerHTML = st;
    for (let item in currentJourneys) {
      if (currentJourneys[item].serviceID == serviceID) {
        currentJourneys[item].arrival = st;
      }
    }
    storeInIDB(currentJourneys, serviceID);
  }).catch(function(error) {
    console.log('There has been a problem with your fetch operation: ' + error.message);
  });
  return st;
}


var storeInIDB = (currentJourneys, serviceID) => {
  var dbPromise = idb.open('train-times', 1, function(upgradeDb) {
        upgradeDb.createObjectStore('trains', { keyPath: 'name' });
  });

  dbPromise.then(function(db) {
    var tx = db.transaction('trains', 'readwrite');
    var trainStore = tx.objectStore('trains');

    trainStore.put({
      name: `${document.getElementById('departure').value.toLowerCase()}:${document.getElementById('destination').value.toLowerCase()}`,
      trains: currentJourneys
    });

    return tx.complete;
  }).then(function() {
    console.log('train added');
    idb.close();
  });
}
