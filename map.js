// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});

var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labelIndex = 0;
var markers = [];


function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 52.23, lng: 21.016 },
        zoom: 6
    });

    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        map: map,
        panel: document.getElementById('some-panel')
    });

    google.maps.event.addListener(map, 'click', function (event) {
        if(markers.length<7) {
            addMarker(event.latLng, map);
            if (labelIndex > 1) {
                calculateAndDisplayRoute(directionsService, directionsDisplay);
            }
        }
    });

    document.getElementById('mode').addEventListener('change', function () {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
    });

    document.getElementById('submit').addEventListener('click', function() {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
    });

    directionsDisplay.addListener('directions_changed', function () {
        computeTotalDistance(directionsDisplay.getDirections());
    });
}


function addMarker(location, map) {
    // Add the marker at the clicked location, and add the next-available label
    // from the array of alphabetical characters.
    var marker = new google.maps.Marker({
        position: location,
        label: labels[labelIndex++ % labels.length],
        draggable: true,
        map: map
    });
    markers.push(marker);
}

function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function clearMarkers() {
    setMapOnAll(null);
}


function deleteMarkers() {
    clearMarkers();
    markers = [];
    labelIndex = 0;
}



function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    /*var waypts = [];
    var inputs = ['waypoint1','waypoint2','waypoint3','waypoint4','waypoint5'];
    for (var i = 0; i < inputs.length; i++) {
        if (document.getElementById(inputs[i]).value != null && document.getElementById(inputs[i]).value != "") {
            waypts.push({
                location: document.getElementById(inputs[i]).value,
                stopover: true
            });
        }
    }*/
    var start;
    var waypts = [];
    var end;
    if (markers.length > 1) {
        start = markers[0].position;
        console.log("Markers[0]:"+markers[0].position);
        waypts = [];
        for (var i = 1; i < markers.length-1; i++) {
            waypts.push({
                location: markers[i].position,
                stopover: true
            });
            console.log("Markers["+i+"]:"+markers[i].position);

        }
        end = markers[i].position;
        console.log("Markers["+i+"]:"+markers[i].position);
    }
    var selectedMode = document.getElementById('mode').value;
    setMapOnAll(null);

    console.log("waypts:"+waypts);
    directionsService.route({
        origin: start,
        destination: end,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode[selectedMode]
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            var route = response.routes[0];
            var total = 0;
            var totalTime = 0;
            for (var i = 0; i < route.legs.length; i++) {
                total += route.legs[i].distance.value;
                totalTime += route.legs[i].duration.value;
            }
            total = (total /1000).toFixed(2);
            var totalTimeH = Math.round(totalTime / 3600);
            var totalTimeM = Math.round((totalTime % 3600)/60);
            document.getElementById('total').innerHTML = "ĹÄ…czny dystans " +total + ' km. ĹÄ…czny czas: '+totalTimeH + " h "+
            totalTimeM + " min.";

            var elevator = new google.maps.ElevationService;
            displayPathElevation(route.overview_path, elevator);
        } else {
            window.alert('Zapytanie jest nieprawidĹ‚owe. PowĂłd: ' + status);
        }
    });
}

function computeTotalDistance(result){
    var route = result.routes[0];
    var total = 0;
    var totalTime = 0;
    console.log(route);
    for (var i = 0; i < route.legs.length; i++) {
        total += route.legs[i].distance.value;
        totalTime += route.legs[i].duration.value;
    }
    total = (total /1000).toFixed(2);
    var totalTimeH = Math.round(totalTime / 3600);
    var totalTimeM = Math.round((totalTime % 3600)/60);
    document.getElementById('total').innerHTML = "ĹÄ…czny dystans " +total + ' km. ĹÄ…czny czas: '+totalTimeH + " h "+
        totalTimeM + " min.";
}



function displayPathElevation(path, elevator) {
    // Create a PathElevationRequest object using this array.
    // Ask for 256 samples along that path.
    // Initiate the path request.
    elevator.getElevationAlongPath({
        'path': path,
        'samples': 512
    }, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(elevations, status) {

    var chartDiv = document.getElementById('elevation_chart');
    if (status !== google.maps.ElevationStatus.OK) {
        // Show the error code inside the chartDiv.
        chartDiv.innerHTML = 'Cannot show elevation: request failed because ' +
            status;
        return;
    }
    // Create a new chart in the elevation_chart DIV.
    var chart = new google.visualization.ColumnChart(chartDiv);

    // Extract the data from which to populate the chart.
    // Because the samples are equidistant, the 'Sample'
    // column here does double duty as distance along the
    // X axis.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    for (var i = 0; i < elevations.length; i++) {
        data.addRow(['', elevations[i].elevation]);
    }

    // Draw the chart using the data within its DIV.
    chart.draw(data, {
        height: 150,
        legend: 'none',
        titleY: 'Elevation (m)'
    });
