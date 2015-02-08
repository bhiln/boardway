var elevator;
var map;
var directionsService = new google.maps.DirectionsService();
var directionsDisplay;
var chart;
var polyline;
var max = 0;
var min = 0;

// The following path marks a general path from Mt.
// Whitney, the highest point in the continental United
// States to Badwater, Death Valley, the lowest point.

var myLoc1;
var myEnd1;
var myLoc2;
var myEnd2;

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', { packages: ['columnchart'] });

// Check to see if this browser supports geolocation.
if (navigator.geolocation) {
    // This is the location marker that we will be using
    // on the map. Let's store a reference to it here so
    // that it can be updated in several places.
    var locationMarker = null;
    // Get the location of the user's browser using the
    // native geolocation service. When we invoke this method
    // only the first callback is requied. The second
    // callback - the error handler - and the third
    // argument - our configuration options - are optional.
    navigator.geolocation.getCurrentPosition(
    function (position) {
        // Check to see if there is already a location.
        // There is a bug in FireFox where this gets
        // invoked more than once with a cahced result.
        if (locationMarker) {
            return;
        }
        // Log that this is the initial position.
        console.log("Initial Position Found");
        myLoc1 = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        myEnd1 = new google.maps.LatLng(position.coords.latitude + 0.05, position.coords.longitude + 0.05);
        myLoc2 = new google.maps.LatLng(position.coords.latitude - 0.02, position.coords.longitude + 0.02);
        myEnd2 = new google.maps.LatLng(position.coords.latitude - 0.04, position.coords.longitude + 0.03);

    },
    function (error) {
        console.log("Something went wrong: ", error);
    },
    {
        timeout: (5 * 1000),
        maximumAge: (1000 * 60 * 15),
        enableHighAccuracy: true
    }
    );
}

function initialize() {

    directionsDisplay = new google.maps.DirectionsRenderer();

    var mapOptions = {
        zoom: 8,
        center: myLoc1,
        mapTypeId: 'terrain'
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById("directionsPanel"));


    // Create an ElevationService.
    elevator = new google.maps.ElevationService();

    // Draw the path, using the Visualization API and the Elevation service.
    //drawPath(myLoc1, myLoc1);
    calcRoute(myLoc1, myEnd1);
}

function drawPath(path) {

    // Create a new chart in the elevation_chart DIV.
    //chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));
    chart = new google.visualization.LineChart(document.getElementById('elevation_chart'));

    // Create a PathElevationRequest object using this array.
    // Ask for 256 samples along that path.
    var pathRequest = {
        'path': path,
        'samples': path.length*2
    }

    // for each (point in path) {

    // }

    // Initiate the path request.
    elevator.getElevationAlongPath(pathRequest, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
    if (status != google.maps.ElevationStatus.OK) {
        return;
    }
    var elevations = results;
    console.log(elevations);

    // Extract the elevation samples from the returned results
    // and store them in an array of LatLngs.
    var elevationPath = [];
    min = elevations[0].elevation;
    max = 0;
    for (var i = 0; i < results.length; i++) {
        elevationPath.push(elevations[i].location);
        if (elevations[i].elevation < min)
            min = elevations[i].elevation;
        if (elevations[i].elevation > max)
            max = elevations[i].elevation;
    }
    min = Math.floor(min);
    max = Math.floor(max);
    console.log(min + " " + max);
    document.getElementById("elevation-change").textContent = (max - min);
    document.getElementById("elevation-max").textContent    = max;
    document.getElementById("elevation-min").textContent    = min;

    // Display a polyline of the elevation path.
    for (var i = 0; i < elevations.length-1; i++){
        var pathOptions = {
            path: [elevationPath[i], elevationPath[i+1]],
            strokeColor: 'hsl(' + (50-(50-0)*((elevations[i].elevation-min)/(max-min))) + ',80%,50%)',
            opacity: 1,
            strokeWeight: 10,
            map: map
        }
        console.log(pathOptions);
        polyline = new google.maps.Polyline(pathOptions);
    }
    // Extract the data from which to populate the chart.
    // Because the samples are equidistant, the 'Sample'
    // column here does double duty as distance along the
    // X axis.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    for (var i = 0; i < results.length; i++) {
        data.addRow(['', elevations[i].elevation]);
    }

    var options = {
      title: 'Company Performance',
      curveType: 'function',
      legend: { position: 'bottom' }
    };

    // Draw the chart using the data within its DIV.
    //document.getElementById('elevation_chart').style.display = 'line';
    chart.draw(data, {
        height: 100,
        width: 150,
        legend: 'none',
        curveType: 'function',
        lineWidth: 1,
        pointSize: 0,
        // hAxis: {
        //     color: '#FFFFFF'
        // },
        // pointSize: 0,
        // vAxis: {
        //     color: '#FFFFFF'
        // },
        titleY: 'Elevation (m)'
    });
}

function calcRoute(lat, long) {
    var start = lat;
    var end = long;
    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.BICYCLING
    };
    directionsService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
            //for each (point in result.routes[0][)
            drawPath(result.routes[0].overview_path);
            console.log(result);
            getHill(myLoc1, myEnd1);
            document.getElementById("location-start").textContent   = result.routes[0].legs[0].start_address;
            document.getElementById("location-end").textContent     = result.routes[0].legs[0].end_address;
            document.getElementById("distance").textContent         = result.routes[0].legs[0].distance.text;
            
        }
    });
}

function getHill(lat, lon) {
    var curLat = lat-0.05;
    var curLong = lon-0.05;
    var max = 0;
    var min = 1000000;

    

    for (var i = 0; i < 100; i++){
        // Create a LocationElevationRequest object using the array's one value
        var positionalRequest = {
            'locations': [curLat, curLong]
        }
        // Initiate the location request
        elevator.getElevationForLocations(positionalRequest, function(results, status) {
            console.log(results);
        });

        curLat = curLat + 0.001;
    }
    //     if (status == google.maps.ElevationStatus.OK) {

    //       // Retrieve the first result
    //       if (results[0]) {

    //         // Open an info window indicating the elevation at the clicked position
    //         infowindow.setContent("The elevation at this point is " + results[0].elevation + " meters.");
    //         infowindow.setPosition(clickedLocation);
    //         infowindow.open(map);
    //       } else {
    //         alert("No results found");
    //       }
    //     } else {
    //       alert("Elevation service failed due to: " + status);
    //     }


    // elevator.
    // for (int i = 0; i < 100; i++){
    //     lats
    // }
}

google.maps.event.addDomListener(window, 'load', initialize);