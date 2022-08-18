//BRR
let geodataUrl = 'data/esar.json';
// let fourWDataUrl = 'data/data.csv';
let fourWDataUrl = 'https://raw.githubusercontent.com/collective-service/cs-kobo-scraper/main/data/data_regional_4w.csv';
let configFileURL = 'data/config.json';
let geomData,
    mappingData,
    filteredMappingData,
    config;

let parentsDefaultListArr = [],
    childrenDefaultListArr = [];
let displayBy = "partner";

$(document).ready(function() {
    function getData() {
        Promise.all([
            d3.json(geodataUrl),
            d3.csv(fourWDataUrl),
            d3.json(configFileURL)
        ]).then(function(data) {
            geomData = topojson.feature(data[0], data[0].objects.ESAR);
            mappingData = data[1];
            filteredMappingData = mappingData;
            config = data[2];
            parentsDefaultListArr = getColumnUniqueValues("Partner_short");
            childrenDefaultListArr = getColumnUniqueValues("Activity");

            createMainFiltersTag("parentFilters");
            // createMainFiltersTag("childrenFilters", []);
            createPanelListItems();
            createChildrenPanel();

            initiateMap();
            setUpdateKeyFigures();
            setMetricsPanels();
            // select all partner/activities by default
            //$(".item-selections button").trigger("click");
            // select all partner/activities by default
            //$(".children-selections button").trigger("click");

            //remove loader and show vis
            $('.loader').hide();
            $('#main').css('opacity', 1);
        }); // then
    } // getData

    getData();
});

$('#displayBySelect').on("change", function(d) {
    displayBy = $('#displayBySelect').val();

    resetToDefault();

    //update map and metrics
});


// parents clear or select all buttons
$(".item-selections button").on("click", function(d) {
    const buttonName = $(this).attr("class");
    if (buttonName == "select-all") {
        $(".collection-item li").each(function(index, li) {
            !$(li).hasClass('is-selected') ? $(li).addClass('is-selected') : null;
        });
        // show children pane
        d3.select("#hide").classed("hidden", false);

        // right toggle
        d3.select("#tutorial").classed("hidden", true);
        d3.select("#projectDetails").classed("hidden", false);

    } else {
        $(".collection-item li").each(function(index, li) {
            $(li).hasClass('is-selected') ? $(li).removeClass('is-selected') : null;
        });
        // hide children pane
        d3.select("#hide").classed("hidden", true);
        if (countrySelectedFromMap != "") {
            d3.select("#hide").classed("hidden", false);
        }

        // right toggle
        d3.select("#tutorial").classed("hidden", false);
        d3.select("#projectDetails").classed("hidden", true);
    }
    // clear filters
    //call reset viz?

    updateDataFromFilters();

    const childrenArr = getUpdatedChildrenArr();
    createChildrenPanel(childrenArr);


    choroplethMap();
    setUpdateKeyFigures();
    setMetricsPanels();
    // update map and metrics
})

// children filters clear or select all
$(".children-selections button").on("click", function(d) {
    const buttonName = $(this).attr("class");
    if (buttonName == "select-all") {
        $(".children li").each(function(index, li) {
            !$(li).hasClass('is-selected') ? $(li).addClass('is-selected') : null;
        });

    } else {
        $(".children li").each(function(index, li) {
            $(li).hasClass('is-selected') ? $(li).removeClass('is-selected') : null;
        });
    }
    // clear filters
    //call reset viz?

    updateDataFromFilters();

    choroplethMap();
    setUpdateKeyFigures();
    setMetricsPanels();
    // update map and metrics
})

function resetToDefault() {
    d3.select(".parentFilters").selectAll("span").classed("is-selected", false);
    d3.select(".collection-item").selectAll("li").classed("is-selected", false);
    d3.select(".children").selectAll("li").classed("is-selected", false);



    // right toggle
    d3.select("#tutorial").classed("hidden", false);
    d3.select("#projectDetails").classed("hidden", true);

    countrySelectedFromMap = "";

    // createMapFilterSpan();
    $(".map-filter").html("");

    const listParentTitle = displayBy == "activity" ? "Activity list" : "Partner list";
    const listChildTitle = displayBy == "activity" ? "Partner list" : "Activity list";
    $(".parent h6").text(listParentTitle);
    // $(".child h6").text(listChildTitle);
    $(".panelContentCentered h6").text(listChildTitle);

    // updateDataFromFilters();
    filteredMappingData = mappingData;

    // updateViz();
    parentsDefaultListArr = getUpdatedParentArr();
    childrenDefaultListArr = getUpdatedChildrenArr();

    createPanelListItems();
    createChildrenPanel();
    // hide children pane
    d3.select("#hide").classed("hidden", false);

    choroplethMap();
    setUpdateKeyFigures();
    setMetricsPanels();

    //$(".item-selections button").trigger("click");
  //$(".children-selections button").trigger("click");
} //resetToDefault

// Global functions

function getColumnUniqueValues(columnName, data = filteredMappingData, splitChart = "|") {
    var returnArr = [];
    data.forEach(element => {
        var arr = element[config[columnName]].split(splitChart);
        var trimedArr = arr.map(x => x.trim());
        trimedArr.forEach(d => {
            returnArr.includes(d.trim()) ? '' : returnArr.push(d.trim());
        });
    });
    var activityCountArr = [];
    returnArr.forEach(element => {
        var nb = 0;
        data.forEach(item => {
            const vals = splitMultiValues(item[config[columnName]]);
            for (let index = 0; index < vals.length; index++) {
                vals[index] == element ? nb++ : null;
            }
        });
        if (nb > 0) {
            activityCountArr.push({ key: element, value: nb });
        }
    });
    activityCountArr.sort(sortNestedData);
    var orderedArr = [];
    activityCountArr.forEach(act => {
        orderedArr.push(act.key);
    });
    return orderedArr;
} //getColumnUniqueValues

function getColumnUniqueKeyValues(columnName, data = filteredMappingData, splitChart = "|") {
    var returnArr = [];
    data.forEach(element => {
        var arr = element[config[columnName]].split(splitChart);
        var trimedArr = arr.map(x => x.trim());
        trimedArr.forEach(d => {
            returnArr.includes(d.trim()) ? '' : returnArr.push(d.trim());
        });
    });
    var activityCountArr = [];
    returnArr.forEach(element => {
        var nb = 0;
        data.forEach(item => {
            const vals = splitMultiValues(item[config[columnName]]);
            for (let index = 0; index < vals.length; index++) {
                vals[index] == element ? nb++ : null;
            }
        });
        if (nb > 0) {
            activityCountArr.push({ key: element, value: nb });
        }
    });
    activityCountArr.sort(sortNestedData);
    return activityCountArr;
} //getColumnUniqueKeyValues

// get unique column values from the data
function uniqueValues(columnName, data = filteredMappingData) {
    const keyValArr = getNestedDataByColumn(columnName, data);
    var arr = [];

    keyValArr.forEach(element => {
        arr.push(element.key);
    });
    return arr;
}

function findOneValue(emergenciesArrTest, arr) {
    return arr.some(function(v) {
        return emergenciesArrTest.indexOf(v) >= 0;
    });
};

function splitMultiValues(arr) {
    const splitArr = arr.split("|");
    var values = [];
    for (let index = 0; index < splitArr.length; index++) {
        values.push(splitArr[index]);
    }
    return values;
} //splitMultiValues

function sortNestedData(a, b) {
    if (a.value > b.value) {
        return -1
    }
    if (a.value < b.value) {
        return 1
    }
    return 0;
} //sortNestedData

function getNestedDataByColumn(col, data = filteredMappingData) {
    var data = d3.nest()
        .key(function(d) { return d[config[col]]; })
        .rollup(function(d) { return d.length; })
        .entries(data).sort(sortNestedData);
    return data;
} //getNestedDataByColumn

function formatArray(arr) {
    var items = [];
    var trimedArr = arr.map(x => x.trim());
    for (let index = 0; index < trimedArr.length; index++) { //remove empty elements
        if (trimedArr[index] && trimedArr[index] != "nan") {
            items.push(trimedArr[index]);
        }
    }
    return items;
} // formatArray

function createMainFiltersTag(className) {
    const arr = uniqueValues("Partner_filtres_tag");
    const cleanedArr = formatArray(arr);

    $("." + className).html('');
    var spans = '';
    for (let index = 0; index < cleanedArr.length; index++) {
        const element = cleanedArr[index];
        spans += '<span class="tagLook tag">' + element + '</span>';
    }
    $("." + className).append(spans);

    $("." + className + " span").on("click", function(d) {
        const isSelected = $(this).hasClass('is-selected');
        if (!isSelected) {
            $(this).addClass('is-selected');
        } else {
            $(this).removeClass('is-selected');
        }
        // remove parent selections!
        updateDataFromFilters();

        updateViz();

    });
} //createMainFiltersTag

function getDetails(from = "parent", item) {
    if (from == "children") {
        return config.Activity_desc[item];
    }
    var record;
    for (let index = 0; index < mappingData.length; index++) {
        const val = mappingData[index];
        if (val[config.Partner_short] == item) {
            record = val;
            break;
        }
    }
    return record;
}

function getSelectedFilters() {
    var items = $(".parentFilters span");
    var selections = [];
    items.each(function(idx, span) {
        const isSelected = $(span).hasClass('is-selected');
        isSelected ? selections.push($(span).text()) : null;
    });
    return selections;
} //getSelectedFilters

function getSelectedItemFromUl(className) {
    var items = $("." + className + " li");
    var selections = [];
    items.each(function(idx, li) {
        const isSelected = $(li).hasClass('is-selected');
        const selection = d3.select(this).selectAll(".item").select("h6").text();
        isSelected ? selections.push(selection) : null;
    });
    return selections;
} //getSelectedItemFromUl

function updateDataFromFilters() {
    var data = mappingData;
    const parentFiltersArr = getSelectedFilters();
    const parentItemSelection = getSelectedItemFromUl("collection-item");
    const childrenItemSelection = getSelectedItemFromUl("children");

    if (parentFiltersArr.length > 0) {
        data = data.filter(function(d) {
            return parentFiltersArr.includes(d[config.Partner_filtres_tag]);
        });
    }

    if (parentItemSelection.length > 0) {

        data = data.filter(function(d) {
            if (displayBy == "activity") {
                const vals = splitMultiValues(d[config.Activity]);
                return findOneValue(parentItemSelection, vals);
            }
            return parentItemSelection.includes(d[config.Partner_short]);
        })
    }
    if (childrenItemSelection.length > 0) {
        const colFilter = displayBy == "activity" ? "Partner_short" : "Activity";
        data = data.filter(function(d) {
            // children = activities
            if (displayBy != "activity") {
                const vals = splitMultiValues(d[config.Activity]);
                return findOneValue(childrenItemSelection, vals);
            }
            return childrenItemSelection.includes(d[config[colFilter]]);
        })
    }

    if (countrySelectedFromMap != "") {
        data = data.filter(d => { return d[config.ISO3] == countrySelectedFromMap; })
    }
    filteredMappingData = data;
    return;
} //updateDataFromFilters

function getUpdatedChildrenArr(data) {
    var arr;
    if (displayBy == "activity") {
        arr = uniqueValues("Partner_short", data);
    } else { //partner
        arr = getColumnUniqueValues("Activity", data);
    }
    return arr;
} //getUpdatedChildrenArr

function getUpdatedParentArr(data) {
    var arr;
    if (displayBy == "activity") {
        arr = getColumnUniqueValues("Activity", data);
    } else { //partner
        arr = uniqueValues("Partner_short", data);
    }
    return arr;
} //getUpdatedParentArr

// gets the list of emergency per activity
function getEmergencyTagArr(pArr, cArr) {
    // const outbreakArr = getColumnUniqueValues(config.Partner_filtres_tag);
    // const arr = uniqueValues(config.Partner_filtres_tag);
    // console.log(outbreakArr)
    // console.log(arr)
    console.log(filteredMappingData)
    var tagsArr = [];
    if (pArr.length == 1) {

    }

}

// =====

function createPanelListItems(arr = parentsDefaultListArr) {
    $(".collection-item").html('');
    const hiddenClass = (!d3.select("#viewDetails").property("checked")) ? "hidden" : '';
    var lis = [];
    for (let index = 0; index < arr.length; index++) {
        const p = (displayBy == "activity") ? getDetails("children", arr[index]) : getDetails("", arr[index])[config.Partner];
        lis += '<li>' +
            '<div class="item">' +
            '<h6>' + arr[index] + '</h6>' +
            '<div class="contenu ' + hiddenClass + '">' +
            '<p>' + p + '</p>' +
            '</div></div>' +
            '</li>';
    }
    $(".collection-item").append(lis);

    $(".collection-item li").on("click", function(d) {
        const isSelected = $(this).hasClass('is-selected');
        if (!isSelected) {
            $(this).addClass('is-selected');
        } else {
            $(this).removeClass('is-selected');
        }
        // remove children selection
        d3.select(".children").selectAll("li").classed("is-selected", false);
        const parentSelection = getSelectedItemFromUl("collection-item");

        updateDataFromFilters();

        choroplethMap();
        setUpdateKeyFigures();
        setMetricsPanels();

        if (parentSelection.length == 0) {
            //hide/show children pane
            d3.select("#hide").classed("hidden", true);
            // right toggle
            d3.select("#tutorial").classed("hidden", false);
            d3.select("#projectDetails").classed("hidden", true);
        } else {
            const childrenArr = getUpdatedChildrenArr();
            createChildrenPanel(childrenArr);
            // getEmergencyTagArr(parentSelection, childrenArr);
            d3.select("#hide").classed("hidden", false);

            d3.select('#tutorial').classed("hidden", true);
            d3.select('#projectDetails').classed("hidden", false);
        }
    });
} //createPanelListItems


function createChildrenPanel(arr = childrenDefaultListArr) {
    $(".children").html('');
    const hiddenClass = (!d3.select("#viewDetails").property("checked")) ? "hidden" : null;
    var lis = [];
    for (let index = 0; index < arr.length; index++) {
        var p = (displayBy == "partner") ? getDetails("children", arr[index]) : getDetails("", arr[index])[config.Partner];
        lis += '<li>' +
            '<div class="item">' +
            '<h6>' + arr[index] + '</h6>' +
            '<div class="contenu ' + hiddenClass + '">' +
            '<p>' + p + '</p>' +
            '</div>' +
            '</li>';
    }
    $(".children").append(lis);

    $(".children li").on("click", function(d) {
        const isSelected = $(this).hasClass('is-selected');
        if (!isSelected) {
            $(this).addClass('is-selected');
        } else {
            $(this).removeClass('is-selected');
        }
        updateDataFromFilters();
        choroplethMap();
        setUpdateKeyFigures();
        // setMetricsPanels();
    });
} //createChildrenPanel


$('#viewDetails').change(function() {
    if (d3.select("#viewDetails").property("checked")) {
        d3.select('.collection-item').selectAll("li")
            .selectAll(".item")
            .selectAll(".contenu")
            .classed("hidden", false);

        d3.select('.children').selectAll("li")
            .selectAll(".item")
            .selectAll(".contenu")
            .classed("hidden", false);
        return;
    }
    d3.select('.collection-item').selectAll("li")
        .selectAll(".item")
        .selectAll(".contenu")
        .classed("hidden", true);
    d3.select('.children').selectAll("li")
        .selectAll(".item")
        .selectAll(".contenu")
        .classed("hidden", true);
});

function setUpdateKeyFigures(data = filteredMappingData) {
    var partners = (displayBy == "partner") ? getSelectedItemFromUl("collection-item") : getSelectedItemFromUl("children");
    if (partners.length == 0) {
        partners = uniqueValues("Partner", data);
    }
    const countriesArr = uniqueValues("Country", data);
    //overall
    d3.select('.keyFigures').select('#numberOrg').text(partners.length);
    d3.select('.keyFigures').select('#numberCountry').text(countriesArr.length);

    // show reset button
    var partnerName = "Overview";
    const temoin = uniqueValues("Partner", mappingData);
    partners.length == 1 ? partnerName = getDetails("", partners[0])[config.Partner] :
        (1 < partners.length && partners.length != temoin.length) ? partnerName = "All partners" : null;

    if (countrySelectedFromMap != "") {
        console.log("number of countries shoudl be 1");
        partnerName = countrySelectedFromMap + " > " + partnerName;
    }

    d3.select("#overview > h1").text(partnerName);
    // d3.select("#overview > img").attr("src", "assets/flags/" + cntryISO3 + ".svg");
    // d3.select("#overview > img").classed("hidden", false);
} //setUpdateKeyFigures

function setMetricsPanels(data = filteredMappingData) {
    //target population
    const targetArr = getColumnUniqueKeyValues("Target", data);
    var targetColors = d3.scaleSequential()
        .domain([targetArr.length, 0])
        .interpolator(d3.interpolate("#FFF5F0", "#EE3224")); //d3.interpolateRgb("red", "blue")(0.5) //d3.interpolatePuRd fdebe9

    $('#target-pop').html('');

    const targetBar = generateBarChart(targetArr);
    var partners = [];
    if (displayBy == "partner") {
        partners = getSelectedItemFromUl("collection-item");
        // Project informations
    } else {
        partners = getUpdatedChildrenArr();
    }

    $(".reports").html('');
    var divReports = "";

    partners.forEach(partner => {
        var report = '<div class="project-report"><div class="partner-logo">';
        // report +='<img src="assets/default.svg">';
        report += '<img src="assets/default.svg"><h5>' + partner + '</h5>';
        report += '</div>';

        // project details
        report += '<div class="projectDescription">' +
            '<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio ipsa, eius ex corrupti totam a. Adipisci ipsam, earum rem accusantium veniam in placeat nesciunt consequatur sequi consequuntur, animi debitis quis.</p>';
        report += '</div>';

        report += '<div class="contact-details"><div>';
        // contact details
        var contact = "";
        for (let index = 0; index < filteredMappingData.length; index++) {
            const val = filteredMappingData[index];
            if (val[config.Partner_short] == partner) {
                contact = '<div class="name">' + val[config.Contact_name] + '</div>' +
                    '<div class="role">' + val[config.Contact_role] + '</div>' +
                    '<div class="email"><i class="fa-solid fa-envelope"></i></div>';
                break;
            }
        }
        report += contact + '</div></div>';

        divReports += report + '</div>';
    });

    $('.reports').html(divReports);

} //setMetricsPanels

const barChartColor = "#798BA5";

function generateBarChart(data) {
    var xArr = ['x'],
        yArr = ['# count'];
    data.forEach(element => {
        xArr.push(element.key);
        yArr.push(element.value);
    });
    var chart = c3.generate({
        bindto: '#target-pop',
        size: {
            height: 220,
            // width: 100
        },
        data: {
            x: 'x',
            columns: [xArr, yArr],
            type: 'bar'
        },
        bar: {
            width: {
                ratio: .5
            }
        },
        color: {
            pattern: [barChartColor]
        },
        axis: {
            rotated: true,
            x: {
                type: 'category',
                // show: false
                tick: {
                    centered: true,
                    outer: false,
                    fit: true,
                    multiline: false
                }
            },
            y: {
                show: false
            }
        },
        legend: {
            show: false
        }
    });
    return chart;
} //generateBarChart

function updateViz(data) {
    const parentsArr = getUpdatedParentArr(data);
    // const childrenArr = getUpdatedChildrenArr(data);

    createPanelListItems(parentsArr);
    // createChildrenPanel(childrenArr);

    choroplethMap(data);
    setUpdateKeyFigures(data);
    setMetricsPanels(data);
} //updateViz

function updateVizFromMap(iso3) {
    var data = mappingData.filter(d => { return d[config["ISO3"]] == iso3; });

    const parentFiltersArr = getSelectedFilters();
    if (parentFiltersArr.length > 0) {
        data = data.filter(function(d) {
            return parentFiltersArr.includes(d[config.Partner_filtres_tag]);
        });
    }
    const childrenArr = getUpdatedChildrenArr(data);

    updateViz(data);

    createChildrenPanel(childrenArr);
    //hide/show children pane
    d3.select("#hide").classed("hidden", false);
} //updateVizFromMap


// map js
let isMobile = $(window).width() < 767 ? true : false;
let countriesArr = [];
let g, mapsvg, projection, width, height, zoom, path;
let viewportWidth = window.innerWidth;
let currentZoom = 1;
let mapFillColor = '#204669', //'#C2DACA',//'#2F9C67',
    mapInactive = '#F2F2EF',
    mapActive = '#D90368',
    hoverColor = '#D90368',
    mapNotClickedColor = "#E9F1EA",
    mapClickedColor = "#f0473a";
let countrySelectedFromMap = "";
// let mapColorRange = ['#fdebe9', '#fac2bd', '#f79992', '#f37066', '#f0473a'];
let mapColorRange = ['#E9F1EA', '#C2DACA', '#9EC8AE', '#78B794', '#2F9C67'];
let mapScale = d3.scaleQuantize()
    .domain([0, 100])
    .range(mapColorRange);

function initiateMap() {
    width = viewportWidth - 860; //document.getElementsByClassName("map").offsetWidth;
    // height = (isMobile) ? 400 : 500;
    height = 80;
    var mapScale = (isMobile) ? width / 5.5 : width / 1.2;
    var mapCenter = (isMobile) ? [12, 12] : [12, 17];

    projection = d3.geoMercator()
        .center(mapCenter) //mapCenter
        .scale(mapScale) //650
        .translate([width / 3.9, height / 2]);

    path = d3.geoPath().projection(projection);
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    mapsvg = d3.select('#map').append("svg")
        .attr("width", width)
        .attr("height", height + "vh")
        .call(zoom)
        .on("wheel.zoom", null)
        .on("dblclick.zoom", null);

    mapsvg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#fff");

    //map tooltips
    var maptip = d3.select('#map').append('div').attr('class', 'd3-tip map-tip hidden');

    const countriesISO3Arr = uniqueValues("ISO3");
    g = mapsvg.append("g");
    g.attr('id', 'countries')
        .selectAll("path")
        .data(geomData.features)
        .enter()
        .append("path")
        .attr('d', path)
        .attr('fill', "#fff")
        .attr('stroke-width', .7)
        .attr('stroke', '#fff')
        .on("click", function(d) {
            // fix inactive but clickage bug
            if (d3.select(this).classed("inactive")) {
                return;
            }
            mapsvg.select('g').selectAll('.hasData').attr('fill', mapNotClickedColor);
            $(this).attr('fill', mapClickedColor);
            $(this).addClass('clicked');
            countrySelectedFromMap = d.properties.ISO_A3;
            updateVizFromMap(d.properties.ISO_A3);
            createMapFilterSpan(d.properties.NAME_LONG);
            const cntryISO3 = String(d.properties.ISO_A3).toUpperCase();
            // show reset button
            d3.select("#overview > h5").text(d.properties.NAME_LONG);
            d3.select("#overview > img").attr("src", "assets/flags/" + cntryISO3 + ".svg");
            d3.select("#overview > img").classed("hidden", false);
            // show tutorial for now
            d3.select("#tutorial").classed("hidden", true);
            d3.select("#projectDetails").classed("hidden", true);
        });

    //country labels
    g.selectAll(".country-label")
        .data(geomData.features)
        .enter().append("text")
        .attr("class", "country-label")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) { return d.properties.NAME; });

    choroplethMap();

    //zoom controls
    d3.select("#zoom_in").on("click", function() {
        zoom.scaleBy(mapsvg.transition().duration(500), 1.5);
    });
    d3.select("#zoom_out").on("click", function() {
        zoom.scaleBy(mapsvg.transition().duration(500), 0.5);
    });


} //initiateMap

// zoom on buttons click
function zoomed() {
    const { transform } = d3.event;
    currentZoom = transform.k;

    if (!isNaN(transform.k)) {
        g.attr("transform", transform);
        g.attr("stroke-width", 1 / transform.k);

        // updateCerclesMarkers()
    }
}

function createMapFilterSpan(country) {
    var spans = "";
    $(".map-filter").html("");
    if (countrySelectedFromMap != "") {
        spans += '<span id="country-name">' + country + '</span>';
        spans += '<button>Clear selection</button>';
        $(".map-filter").append(spans);

        $('.map-filter button').on("click", function() {
            resetToDefault();
        });
        return;
    }
}

function choroplethMap(mapData = filteredMappingData) {
    if (countrySelectedFromMap != "") {
        return;
    }
    const data = getNestedDataByColumn("ISO3", mapData);
    // console.log(data);
    var countriesArr = [];
    data.forEach(element => {
        countriesArr.push(element.key);
    });
    var max = data[0].value;
    mapsvg.selectAll('path').each(function(element, index) {
        d3.select(this).transition().duration(500).attr('class', function(d) {
            var className = (countriesArr.includes(d.properties.ISO_A3)) ? 'hasData' : 'inactive';
            return className;
        });
        d3.select(this).transition().duration(500).attr('fill', function(d) {
            var filtered = data.filter(pt => pt.key == d.properties.ISO_A3);
            var num = (filtered.length != 0) ? filtered[0].value : null;
            var clr = (num == null) ? mapInactive : mapScale(Math.round((num * 100) / max));
            return clr;
        });
    });

} //choroplethMap

$('.reset-map').on("click", function() {
    resetToDefault();

    // hide reset button
    d3.select("#overview > h5").text("Overview");
    d3.select("#overview > img").attr("src", "");
    d3.select("#overview > img").classed("hidden", true);
    // d3.select("#map-filters").classed("hidden", true);
});
