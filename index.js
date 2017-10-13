//Based on https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172 by Mike Bostock

/* 
- Selects the 'svg' from the HTML file.
- Define margins and size (width and height).
*/
var svg = d3.select('svg');
// Zoom (Big graph)
var margin = {top: 20, right: 20, bottom: 10, left: 40};
var height = +svg.attr('height') - margin.top - margin.bottom;
// Brush
var marginB = {top: 370, right: 20, bottom: 20, left: 40};
var heightB = 435 - marginB.top - marginB.bottom;
var width = 900 - margin.left - margin.right;

/*
- x/xB: scaleTime = Will create a linear scale for timeline with a range between 0 and the width
- y/yB: scaleLinear = The data showed will grow from 0 to a specified height.
*/
// Zoom
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);
// Brush
var xB = d3.scaleTime().range([0, width]);
var yB = d3.scaleLinear().range([heightB, 0]);

/* 
- xAxis/xAxisB: Creates a x axis and assigns the data of the x axis to show on the bottom of the axis
- yAxis: Creates a y axis for the zoom graph and assigns the data of the y axis to show on the the left of the axis
*/
// Zoom
var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);
// Brush
var xAxisB = d3.axisBottom(xB);

/*
Creates the highlight  above de brush area.
- It shows in with area of the time line you're looking on the zoomed chart.
- When the highlight  is pulled to the end the function brushed will be executed.
*/
var brush = d3.brushX()
.extent([[0, 0], [width, heightB]])
.on('brush end', brushed)

/*
Zoom effect will be created by scrolling with the mouse.
*/
var zoom = d3.zoom()
.scaleExtent([1, 50])
.on('zoom', zoomed);

/*
The data is assigned the variable areaGraph and the areaBrush.
- areaGraph represents the area where the zoom graph is showed.
- areaBrush represents the area where the brush graph is showed.
*/
var areaGraph = d3.area()
.x(function(d) { return x(d.date); })
.y0(height)
.y1(function(d) { return y(d.sunHours); })

var areaBrush = d3.area()
.x(function(d) { return xB(d.date); })
.y0(heightB)
.y1(function(d) { return yB(d.sunHours); })

// Used to don't let the graph go out on the sides when zooming
svg.append("defs").append("clipPath")
.attr("id", "clip")
.append("rect")
.attr("width", width)
.attr("height", height);

/*
The zoom graph is been created.
- Create 'g' element inside the svg element
- translates between the data input and the display (x, y) on the canvas
*/
var zoomGraph = svg.append('g')
.attr('class', 'zoomGraph')
.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

/*
The context graph is been created.
- Create 'g' element inside the svg element
- translates between the data input and the display (x, y) under near the brush.
*/
var brushGraph = svg.append('g')
.attr('class', 'brushGraph')
.attr('transform', 'translate(' + marginB.left + ',' + marginB.top + ')');

/*
A dirty data(index.txt) is saved inside the variable doc. 
- Introduction text is inside the variable header saved.
- Blank (enter) space is saved inside the variable endHeader.
- Text from endHeader and above is removed.
- Data is further cleaned. 
- Inside the paseTime variable is a new time option saved. 
*/
// Loading the data
var doc = d3.text('index.txt')
  .mimeType('text/plain')
  .get(onload);

function onload(err, doc) {
  if (err) throw err;

  var header = doc.indexOf('STN,YYYYMMDD');
  var endHeader = doc.indexOf('\n', header);
  var parseTime = d3.timeParse('%Y%m%d')

  doc = doc.slice(endHeader);
  doc = doc.replace('#', '').trim();
  doc = doc.replace(/ +/g, '');

  /*
  The cleaned doc is assigned to a variable data.
  - In the function map is told that if there is no data available in the row 18 the function will return.
  - Otherwise there will be a data for 'date' of parseTime with array 1 and 'sunHours' with array 18. 
  */
  var data = d3.csvParseRows(doc, map)
  function map(d) {
    // if no sunHours is available, return to prevent data drawing
    if (d[18] === '') {
        return ;
      }
    return {
      date: parseTime(d[1]),
      sunHours: Number(d[18]),
      rainfall: Number(d[20]) 
    }
  }

  // console.log(data)
  
  /*
  The domain specifies the data maximum and minimum
  - It maps the ranges of the x and y for the zoom graph and the brush graph
  - In the x axis the 'date' data will be showed
  - In the y axis the 'sunHours' data will be showed
  */
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.sunHours })]);
  xB.domain(x.domain());
  yB.domain(y.domain());
  
  // The line of the zoom graph is created an assigned to the data. 
  zoomGraph.append('path')
    .datum(data)
    .attr('class', 'area')
    .attr('d', areaGraph)
    .style('fill', '#FDB813')
   
  // The x axis is generating from code that adds the axis to the graph. 
  zoomGraph.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
    .append("text") // Add text 
    .attr("class", "label") // Add class element with the name of "label".
    .attr("x", width) // Set x position.
    .attr("y", 30) // Set y position.
    .style("text-anchor", "end") // Text end alignment
    .text("Time line");
  
  // The y axis is generating from code that adds the axis to the graph.  
  zoomGraph.append('g')
    .attr('class', 'axis axis--y')
    .call(yAxis)
    .append("text") // Add text 
    .attr("class", "label") // Add class element with the name of "label".
    .attr("transform", "rotate(-90)") // rotates element -90grades
    .attr("y", -40) // Set y position
    .style("text-anchor", "end") // Text end alignment
    .text("Duration (in 0.1 hour) ");
    
  // The line of the brush graph is created an assigned to the data. 
  brushGraph.append('path')
    .datum(data)
    .attr('class', 'area')
    .attr('d', areaBrush)
    
    
  // The x axis is generating from code that adds the axis to the graph.
  brushGraph.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + heightB + ')')
    .call(xAxisB)
    .append("text") // Add text 
    .attr("class", "label") // Add class element with the name of "label".
    .attr("x", width) // Set x position.
    .attr("y", 30) // Set y position.
    .style("text-anchor", "end") // Text end alignment
    .text("Time line");
  
  // The highlight  is drawn. 
  brushGraph.append('g')
    .attr('class', 'brush')
    .call(brush)
    .call(brush.move, x.range());
  
  // The zoom effect(scroll) is assigned to the zoomGraph area.
  svg.append('rect')
    .attr('class', 'zoom')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .call(zoom);
};
    
/*
Changes the width and position of the highlight  when zooming and dragging on the brush.
*/
function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type ==='zoom')return; // ignore brush-by-zoom
  var s = d3.event.selection || xB.range();
  x.domain(s.map(xB.invert, xB));
  zoomGraph.select('.area').attr('d', areaGraph);
  zoomGraph.select('.axis--x').call(xAxis);
  svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0));
}

/*
Rescale the zoomGraph area of the chart when zooming:
*/
function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type ==='brush')return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(xB).domain());
  zoomGraph.select('.area').attr('d', areaGraph);
  zoomGraph.select('.axis--x').call(xAxis);
  // brushGraph.select('.brush').call(brush.move, x.range());
}


