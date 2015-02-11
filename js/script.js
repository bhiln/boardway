var rendererOptions = {
    suppressPolylines: true
};

var elevator;
var map;
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
var stepDisplay;
var chart;
var polyline;
var max = 0;
var min = 0;
var curMarker;
var markerArray = [];
var polyline;
var polylineArray = [];
var routes = [];
var count = 0;

// The following path marks a general path from Mt.
// Whitney, the highest point in the continental United
// States to Badwater, Death Valley, the lowest point.

var myCurLoc = new google.maps.LatLng(37.242740, -80.393901);
var myEnd1 = new google.maps.LatLng(37.242584, -80.363977);
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
        //console.log("Initial Position Found");
        myCurLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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
    var mapOptions = {
        maxZoom: 18,
        center: myCurLoc,
        mapTypeId: 'terrain'
    }

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById("directionsPanel"));

    // Create an ElevationService.
    elevator = new google.maps.ElevationService();

    // Instantiate an info window to hold step text.
    stepDisplay = new google.maps.InfoWindow();

    if(typeof(Storage) !== "undefined") {
        for (var key in localStorage) {
            var tempLoc = localStorage.getItem(key);
            console.log("SAVED")
            console.log(tempLoc[1]);
            //myCurLoc = new google.maps.LatLng(tempLoc[0].latitude, tempLoc[0].longitude);
        }
    } else {
        // Sorry! No Web Storage support..
        console.log("No web storage support...");
    }

    var markerImage = {
        url: "../img/bw_pin.png",
        // This marker is 20 pixels wide by 32 pixels tall.
        size: new google.maps.Size(20, 32),
        // The origin for this image is 0,0.
        origin: new google.maps.Point(0,0),
        // The anchor for this image is the base of the flagpole at 0,32.
        anchor: new google.maps.Point(0, 32)
    };

    curMarker = new google.maps.Marker({
        position: myCurLoc,
        map: map,
        icon: new google.maps.MarkerImage( "../img/bw_pin.png" , undefined, undefined, undefined, new google.maps.Size(25, 32));,
        animation: google.maps.Animation.DROP,
        title:"You are here!"
    });
    google.maps.event.addListener(curMarker, 'click', toggleBounce);

    getHill(myCurLoc);
}

function toggleBounce() {

  if (curMarker.getAnimation() != null) {
    curMarker.setAnimation(null);
  } else {
    curMarker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

function drawPath(path) {

    // Create a new chart in the elevation_chart DIV.
    //chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));
    chart = new google.visualization.LineChart(document.getElementById('elevation_chart'));

    console.log("PATH");
    console.log(path);

    // Create a PathElevationRequest object using this array.
    // Ask for 256 samples along that path.
    var pathRequest = {
        'path': path,
        'samples': path.length
    }

    // for each (point in path) {

    // }

    // Initiate the path request.
    elevator.getElevationAlongPath(pathRequest, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {

    console.log("in plotElevation");
    console.log(status);
    if (status != google.maps.ElevationStatus.OK) {
        return;
    }
    var elevations = results;
    //console.log(elevations);

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
    //console.log(min + " " + max);
    document.getElementById("elevation-change").textContent = (max - min);
    document.getElementById("elevation-max").textContent    = max;
    document.getElementById("elevation-min").textContent    = min;

    for (var i = 0; i < polylineArray.length; i++) {
        polylineArray[i].setMap(null);
    }
    polylineArray = [];
    

    // Display a polyline of the elevation path.
    for (var i = 0; i < elevations.length-1; i++){
        var pathOptions = {
            path: [elevationPath[i], elevationPath[i+1]],
            strokeColor: 'hsl(' + (50-(50-0)*((elevations[i].elevation-min)/(max-min))) + ',80%,50%)',
            opacity: 1,
            strokeWeight: 7,
            geodesic: true,
            map: map
        }
        //console.log(pathOptions);
        polyline = new google.maps.Polyline(pathOptions);
        polylineArray.push(polyline);
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

    // //Display a polyline of the elevation path.
    // var pathOptions = {
    //     path: elevationPath,
    //     strokeColor: '#FFFFFF',
    //     opacity: 1,
    //     strokeWeight: 7,
    //     map: map
    // }
    // //console.log(pathOptions);
    // polyline = new google.maps.Polyline(pathOptions);

    // //Display a polyline of the elevation path.
    // var pathOptions = {
    //     path: elevationPath,
    //     strokeColor: '#0000FF',
    //     opacity: 1,
    //     strokeWeight: 2,
    //     map: map
    // }
    //console.log(pathOptions);
    polyline = new google.maps.Polyline(pathOptions);
}

function calcRoute(start, end) {
    var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.BICYCLING
    };

    // First, remove any existing markers from the map.
    for (var i = 0; i < markerArray.length; i++) {
        markerArray[i].setMap(null);
    }

    // Now, clear the array itself.
    markerArray = [];

    directionsService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            //for each (point in result.routes[0][)
            drawPath(result.routes[0].overview_path);
            directionsDisplay.setDirections(result);
            showSteps(result);
            console.log("Drawing map");
            document.getElementById("location-start").textContent   = result.routes[0].legs[0].start_address;
            document.getElementById("location-end").textContent     = result.routes[0].legs[0].end_address;
            document.getElementById("distance").textContent         = result.routes[0].legs[0].distance.text;
            
        }
    });
}

function showSteps(directionResult) {
  // For each step, place a marker, and add the text to the marker's
  // info window. Also attach the marker to an array so we
  // can keep track of it and remove it when calculating new
  // routes.
  var myRoute = directionResult.routes[0].legs[0];

  for (var i = 0; i < myRoute.steps.length; i++) {
    var marker = new google.maps.Marker({
      position: myRoute.steps[i].start_location,
      map: map
    });
    attachInstructionText(marker, myRoute.steps[i].instructions);
    markerArray[i] = marker;
  }
}

function attachInstructionText(marker, text) {
  google.maps.event.addListener(marker, 'click', function() {
    // Open an info window when the marker is clicked on,
    // containing the text of the step.
    stepDisplay.setContent(text);
    stepDisplay.open(map, marker);
  });
}

function getHill(loc) {
    var curLat = loc.k+0.05;
    var curLong = loc.D+0.05;
    var max;
    var min;
    var positionalRequest;
    var latslongs = [];
    var allResults = [];

    // ////console.log(latslongs);
    // positionalRequest = {
    //     'locations': [new google.maps.LatLng(curLat, curLong)]
    // }
    
    // elevator.getElevationForLocations(positionalRequest, function(results, status) {
            
    //     console.log(results);
    //     allResults = [results];
    // });

    latslongs.push(new google.maps.LatLng(curLat, curLong));

    for (var j = 0; j < 50; j++){
        // Create a LocationElevationRequest object using the array's one value
        
        

        curLong = curLong - 0.1;
        latslongs.push(new google.maps.LatLng(curLat, curLong));
        curLat = curLat - 0.001;
        latslongs.push(new google.maps.LatLng(curLat, curLong));
        curLong = curLong + 0.1;
        latslongs.push(new google.maps.LatLng(curLat, curLong));
        curLat = curLat - 0.001;
        latslongs.push(new google.maps.LatLng(curLat, curLong));
    }

    console.log("LATSLONGS");
    console.log(latslongs);

    var pathRequest = {
        'path': latslongs,
        'samples': latslongs.length*2
    }

    // for each (point in path) {

    // }

    // Initiate the path request.
    elevator.getElevationAlongPath(pathRequest, function(results, status){
        console.log("HERE IT IS");
        console.log(status);
        console.log(results);

        min = results[0];
        max = results[0];
        for (var i = 0; i < results.length; i++) {
            if (results[i].elevation < min.elevation)
                min = results[i];
            if (results[i].elevation > max.elevation)
                max = results[i];
        }
        console.log(max);


        if (localStorage.getItem([max.location, min.location]) == null)
            localStorage.setItem([max.location, min.location], [max.location.D, max.location.k, min.location.D, min.location.k]);
        else
            console.log("ROUTE ALREADY EXISTS");

        calcRoute(max.location, min.location);
    });

    

    // curLat = loc.k-0.05;
    // curLong = curLong + 0.001;
    // latslongs = [];
    // window.setTimeout(function(){},1000);
    // // wait = true;
    // // setTimeout("wait = true", 2000);

    //console.log("HERE ARE THE RESULTS");
    //console.log(allResults);

    // if (status == google.maps.ElevationStatus.OK) {

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