//Init Map
//*******************************************************************************************************************************************************
var lat = 41.141376;
var lng = -8.613999;
var zoom = 14;
var myData;

// add an OpenStreetMap tile layer
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';


var grayscale = L.tileLayer(mbUrl, {
        id: 'mapbox.light',
        attribution: mbAttr
    }),
    streets = L.tileLayer(mbUrl, {
        id: 'mapbox.streets',
        attribution: mbAttr
    });


var map = L.map('map', {
    center: [lat, lng], // Porto
    zoom: zoom,
    layers: [streets],
    zoomControl: true,
    fullscreenControl: true,
    fullscreenControlOptions: { // optional
        title: "Show me the fullscreen !",
        titleCancel: "Exit fullscreen mode",
        position: 'bottomright'
    }
});

var baseLayers = {
    "Grayscale": grayscale, // Grayscale tile layer
    "Streets": streets, // Streets tile layer
};

layerControl = L.control.layers(baseLayers, null, {
    position: 'bottomleft'
}).addTo(map);

// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var featureGroup = L.featureGroup();

var drawControl = new L.Control.Draw({
    position: 'bottomright',
	collapsed: false,
    draw: {
        // Available Shapes in Draw box. To disable anyone of them just convert true to false
        polyline: false,
        polygon: false,
        circle: false,
        rectangle: true,
        marker: false,
    }

});
map.addControl(drawControl); // To add anything to map, add it to "drawControl"
//*******************************************************************************************************************************************************
//*****************************************************************************************************************************************
// Index Road Network by Using R-Tree
//*****************************************************************************************************************************************
var rt = cw(function(data,cb){
	var self = this;
	var request,_resp;
	importScripts("js/rtree.js");
	if(!self.rt){
		self.rt=RTree();
		request = new XMLHttpRequest();
		request.open("GET", data);
		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
				_resp=JSON.parse(request.responseText);
				self.rt.geoJSON(_resp);
				cb(true);
			}
		};
		request.send();
	}else{
		return self.rt.bbox(data);
	}
});

rt.data(cw.makeUrl("js/trips.json"));
//*****************************************************************************************************************************************
function clearMap() {
    for (i in map._layers) {
        if (map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            } catch (e) {
                console.log("problem with " + e + map._layers[i]);
            }
        }
    }
}
//*****************************************************************************************************************************************
// Drawing Shapes (polyline, polygon, circle, rectangle, marker) Event:
// Select from draw box and start drawing on map.
//*****************************************************************************************************************************************

map.on('draw:created', function (e) {

  clearMap();


	var type = e.layerType,
		layer = e.layer;

	if (type === 'rectangle') {
		console.log(layer.getLatLngs()); //Rectangle Corners points
		var bounds=layer.getBounds();
		rt.data([[bounds.getSouthWest().lng,bounds.getSouthWest().lat],[bounds.getNorthEast().lng,bounds.getNorthEast().lat]]).
		then(function(d){var result = d.map(function(a) {return a.properties;});
		console.log(result);		// Trip Info: avspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames, taxiid, tripid
		myData = result;
		DrawRS(result);
		myScatterplot(result);
		});
	}

	drawnItems.addLayer(layer);			//Add your Selection to Map
});
//*****************************************************************************************************************************************
// DrawRS Function:
// Input is a list of road segments ID and their color. Then the visualization can show the corresponding road segments with the color
// Test:      var input_data = [{road:53, color:"#f00"}, {road:248, color:"#0f0"}, {road:1281, color:"#00f"}];
//            DrawRS(input_data);
//*****************************************************************************************************************************************
function DrawRS(trips) {
	for (var j=0; j<trips.length; j++) {  // Check Number of Segments and go through all segments
		var TPT = new Array();
		TPT = TArr[trips[j].tripid].split(',');  		 // Find each segment in TArr Dictionary.
		var polyline = new L.Polyline([]).addTo(drawnItems);
        polyline.setStyle({
            color: 'red',                      // polyline color
			weight: 1,                         // polyline weight
			opacity: 0.5,                      // polyline opacity
			smoothFactor: 1.0
        });
		for(var y = 0; y < TPT.length-1; y=y+2){    // Parse latlng for each segment
			polyline.addLatLng([parseFloat(TPT[y+1]), parseFloat(TPT[y])]);
		}
	}
}

//beginning scatter plot function
function myScatterplot(data){
	//entails settings and variables used to control plot; for instance, size and width.
	var width = 200,
    size = 150 ,
    padding = 17.5;

	//declaring x and y axes, and providing ranges for size.

var p= data.length;

	var x = d3.scale.linear()
		.range([padding / 2, size - padding / 2]);



	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(5);
	var y = d3.scale.linear()
		.range([size - padding / 2, padding / 2]);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(5);

  var notreq =["avspeed","distance","duration","maxspeed"];

	var color = d3.scale.category10();
	//xbyFeature will divide each x by their property(duration, distance, etc).
	var xbyFeature = {},
    //   features = d3.keys(data[0]).filter(function(d) {d=['avspeed','distance','duration','maxspeed'];
    // return d; }),
    // var ka = data.length;
    // for i in range(0,ka):

    // for(i=0; i< data.length; i++)
    
       features= d3.keys(data[0]);

       //features = d3.keys(data[]),
    k= features.splice(0,3),
      n = k.length;

  k.forEach(function(feature) {
    xbyFeature[feature] = d3.extent(data, function(d) { return +d[feature]; });
  });
	//controls the size of the tiny data point dots showcased in the scatter plot
  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);

  var brush = d3.svg.brush()
      .x(x)
      .y(y)
      .on("brushstart", brushstart)
      .on("brush", brushmove)
      .on("brushend", brushend);
	//moving scatter plot/image to the right side of the index.html
  var svg = d3.select("#rightside").append("svg")
      .attr("width", size * n + padding)
      .attr("height", size * n + padding)
    .append("g")
      .attr("transform", "translate(" + padding + "," + padding / 2 + ")");
	//implementation of the scatter plot using svg features for x and y axes, and the crossed paths also to showcase pair-wise relationships
  svg.selectAll(".x.axis")
      .data(k)
    .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
      .each(function(d) { x.domain(xbyFeature[d]); d3.select(this).call(xAxis); });

  svg.selectAll(".y.axis")
      .data(k)
    .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { y.domain(xbyFeature[d]); d3.select(this).call(yAxis); });

  var matrix = svg.selectAll(".matrix")
      .data(crossPath(k, k))
    .enter().append("g")
      .attr("class", "matrix")
      .attr("transform", function(d) {
console.log("hie")
        return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

  matrix.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  matrix.call(brush);

  function plot(p) {
    var matrix = d3.select(this);

    x.domain(xbyFeature[p.x]);
    y.domain(xbyFeature[p.y]);

    matrix.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    matrix.selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("cx", function(d) {
console.log("hiell")
           return x(d[p.x]); })
        .attr("cy", function(d) { return y(d[p.y]); })
        .attr("r", 3)
        .style("fill", function(d) { return color(d.properties); });
  }

  var matrixB;

//sequences of the brushing effect: beginning, middle, and end.

  function brushstart(p) {
    if (matrixB !== this) {
      d3.select(matrixB).call(brush.clear());
      x.domain(xbyFeature[p.x]);
      y.domain(xbyFeature[p.y]);
      matrixB = this;
    }
  }

  function brushmove(m) {
    var exe = brush.extent();
    svg.selectAll("circle").classed("hidden", function(d) {
      return exe[0][0] > d[m.x] || d[m.x] > exe[1][0]
          || exe[0][1] > d[m.y] || d[m.y] > exe[1][1];
    });
  }

  function brushend() {
    if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
  }

  function crossPath(x, y) {
    var z = [], n = x.length, m = y.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) z.push({x: x[i], i: i, y: y[j], j: j});
    return z;
  }
  //alternating padding features to fit within screen.

  d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
}
