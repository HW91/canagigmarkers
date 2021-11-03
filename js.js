mapboxgl.accessToken = 'pk.eyJ1IjoiY2FuYWdpZyIsImEiOiJja3V6dzdtNWYydGExMndvZG12NThqbmpkIn0._qXSCKmbH3kafrivy_7o9w';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/light-v9', //stylesheet location
    center: [-96.1581974, 36.1519752], // starting position
    zoom: 3 // starting zoom
});

map.addControl(new MapboxGeocoder({
    accessToken: mapboxgl.accessToken
}));
map.on('load', function () {

    // Add a new source from our GeoJSON data and set the
    // 'cluster' option to true.
    map.addSource("earthquakes", {
        type: "geojson",
        // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
        // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
        data: "https://gist.githubusercontent.com/Duermael/fd62c5ef80eceaf3b1a71a0f15aec60f/raw/1c01a3a80273e8d1d7e8d70385a2d6616d203e0f/map.geojson",
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 40 // Radius of each cluster when clustering points (defaults to 50)
    });

    // Use the earthquakes source to create five layers:
    // One for unclustered points, three for each cluster category,
    // and one for cluster labels.
    map.addLayer({
        "id": "unclustered-points",
        "type": "symbol",
        "source": "earthquakes",
        "filter": ["!has", "point_count"],
        "layout": {
            "icon-image": "marker-15"
        }
    });
    // Display the earthquake data in three layers, each filtered to a range of
    // count values. Each range gets a different fill color.
    var layers = [
        [20, '#f28cb1'],
        [10, '#F1F075'],
        [0, '#51bbd6']
    ];

    layers.forEach(function (layer, i) {
        map.addLayer({
            "id": "cluster-" + i,
            "type": "circle",
            "source": "earthquakes",
            "paint": {
                "circle-color": layer[1],
                "circle-radius": 18
            },
            "filter": i === 0 ?
                [">=", "point_count", layer[0]] :
                ["all",
                    [">=", "point_count", layer[0]],
                    ["<", "point_count", layers[i - 1][0]]]
        });
    });

    // Add a layer for the clusters' count labels
    map.addLayer({
        "id": "cluster-count",
        "type": "symbol",
        "source": "earthquakes",
        "layout": {
            "text-field": "{point_count}",
            "text-font": [
                "DIN Offc Pro Medium",
                "Arial Unicode MS Bold"
            ],
            "text-size": 12
        }
    });
});

map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-points'] });
    map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

    if (!features.length) {
        return;
    }

    var feature = features[0];

    // Populate the popup and set its coordinates
    // based on the feature found.


    var popup = new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML("<b>Code unité&nbsp;:</b> " + feature.properties.CODE_UNITE + "<br />" + "<b>Intitulé unité&nbsp;:</b> " + feature.properties.INTITULE_UNITE + "<br />" +
            "<b>Section pilote&nbsp;:</b> " + feature.properties.SECTION_PILOTE + "<br />" +
            "<b>Délégation régionale&nbsp;: </b> " + feature.properties.LIBELLE_DELEGATION + "<br />" +
            "<b>Site&nbsp;: </b> " + feature.properties.Site_CNRS + "<br />" +
            "<b>Adresse postale&nbsp;: </b> " + "<br />" + feature.properties.LIB_COURT_ORG_IMPLANTATION + "<br />" + feature.properties.BATIMENT + "<br />" + feature.properties.RUE + "<br />" + feature.properties.CODE_POSTAL + "&nbsp;" + feature.properties.BUREAU_DISTRIBUTEUR + "<br />" +
            feature.properties.PAYS + "<br />" + "<b>Adresse web&nbsp;:</b> <a href='" + feature.properties.ADRESSE_WEB + "' target='_blank'>" + feature.properties.ADRESSE_WEB + "</a>" + "<br />" +
            "<b>Fiche Prospective emploi&nbsp;:</b> <a href='" + feature.properties.PE + "' target='_blank'>" + feature.properties.PE + "</a>" + "<br />" +
            "<b>Fiche Bilan social&nbsp;:</b> <a href='" + feature.properties.BS + "' target='_blank'>" + feature.properties.BS + "</a>" + "<br />" +
            "<b>Historique moyens humains&nbsp;:</b> <a href='" + feature.properties.MH + "' target='_blank'>" + feature.properties.MH + "</a>")
        .addTo(map);
});



