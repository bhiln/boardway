<script>
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
        chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));

        // Create a PathElevationRequest object using this array.
        // Ask for 256 samples along that path.
        var pathRequest = {
            'path': path,
            'samples': path.length*2
        }

        // Initiate the path request.
        elevator.getElevationAlongPath(pathRequest, plotElevation);
        console.log(elevator);
    }

    // Takes an array of ElevationResult objects, draws the path on the map
    // and plots the elevation profile on a Visualization API ColumnChart.
    function plotElevation(results, status) {
        if (status != google.maps.ElevationStatus.OK) {
            return;
        }
        var elevations = results;

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
        console.log(min + " " + max);

        // Display a polyline of the elevation path.
        var pathOptions = {
            path: elevationPath,
            strokeColor: '#0000CC',
            opacity: 0.4,
            map: map
        }
        polyline = new google.maps.Polyline(pathOptions);

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

        // Draw the chart using the data within its DIV.
        document.getElementById('elevation_chart').style.display = 'block';
        chart.draw(data, {
            height: 150,
            legend: 'none',
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
                document.getElementById("routeInfo").textContent = "Start Location: " + result.routes[0].legs[0].start_address
                                                                 + " End location: " + result.routes[0].legs[0].end_address
                                                                 + " Distance: " + result.routes[0].legs[0].distance.text
                                                                 + " Change in elevation: " + (max - min)
                                                                 + " Max: " + max
                                                                 + " Min: " + min;
            }
        });
    }

    google.maps.event.addDomListener(window, 'load', initialize);

</script>