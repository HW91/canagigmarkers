mapboxgl.accessToken =
  "pk.eyJ1IjoiY2FuYWdpZyIsImEiOiJja3V6dzdtNWYydGExMndvZG12NThqbmpkIn0._qXSCKmbH3kafrivy_7o9w";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/canagig/ckv4ib5425pot14o6shn1e64g",
  center: [-101.871088,36.717658],
  zoom: 3,
});

const nav = new mapboxgl.NavigationControl({ showCompass: false });
map.addControl(nav, 'top-right');
// Add geolocate control to the map.
map.addControl(
  new mapboxgl.GeolocateControl({
  positionOptions: {
  enableHighAccuracy: false
  },
  // When active the map will receive updates to the device's location as it changes.
  trackUserLocation: true,
  // Draw an arrow next to the location dot to indicate which direction the device is heading.
  showUserHeading: true
  })
  );
// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  // closeButton: false,
});

var filterEl = document.getElementById("feature-filter");
var listingEl = document.getElementById("feature-listing");

function renderListings(features) {
  var empty = document.createElement("p");
  // Clear any existing listings
  listingEl.innerHTML = "";
  if (features.length) {
    features.forEach(function (feature) {
      var prop = feature.properties;
      var item = document.createElement("a");
      item.style.cursor = "pointer";
      // item.href = prop.wikipedia;
      // item.target = '_blank';
      item.innerHTML =
        '<img class="name" src="' +
        prop.logo +
        '"><p class="name">Title: ' +
        prop.name +
        "</p>" +
        "<p class='name'>Company: " +
        prop.company +
        "</p>" +
        "<p class='name'>Location: " +
        prop.location +
        "</p>";
      item.addEventListener("mouseover", function () {
      //   // Highlight corresponding feature on the map
        popup
          .setLngLat(feature.geometry.coordinates)
          .setHTML(
            "<img class='first-popup' src='" +
            feature.properties.logo +
            "'></br>" +
            "<b class='first-popup'>Title: " +
            feature.properties.name +
            "</b>" +
            "<p class='first-popup'>Company: " +
            feature.properties.company +
            "</p><p class='first-popup'>Job Type: " +
            feature.properties.jobType +
            "</p>" +
            "<button class='first-popup'>See more</button>"
          )
          .addTo(map);
      //   // Fly the map to the location.

      });
      item.addEventListener("click", function () {
        popup
          .setLngLat(feature.geometry.coordinates)
          .setHTML(
            "<img class='first-popup' src='" +
            feature.properties.logo +
            "'></br>" +
            "<b class='first-popup'>Title: " +
            feature.properties.name +
            "</b>" +
            "<p class='first-popup'>Company: " +
            feature.properties.company +
            "</p><p class='first-popup'>Job Type: " +
            feature.properties.jobType +
            "</p>" +
            "<button class='first-popup'>See more</button>"
          )
          .addTo(map);
        map.flyTo({
          center: feature.geometry.coordinates,
          zoom: 9,
        });
      })


      listingEl.appendChild(item);

      // start custom second popup - sidebar
      $("button.first-popup").on("click", function () {
        $("div.sidebar").addClass("visible");
        $("div.sidebar").html(
          '<div class="sidebar-content"><span class="close-button"> X</span><div class="sidebar-content-inner">' +
          "<img class='sidebar-image' src='" +
          feature.properties.logo +
          "'></br>" +
          "<b class='sidebar-bold'>Title: " +
          feature.properties.name +
          "</b>" +
          "<p class='sidebar-paragraph'>Company: " +
          feature.properties.company +
          "</p><p class='sidebar-paragraph'>Job Type: " +
          feature.properties.jobType +
          "</p>" +
          "<p class='sidebar-paragraph'>Salary: " +
          feature.properties.salary +
          "</p>" +
          "<p class='sidebar-paragraph'>Location: " +
          feature.properties.location +
          "</p>" +
          "<p class='sidebar-paragraph'>Date Posted: " +
          feature.properties.postingDate +
          "</p>" +
          "<button class='sidebar-button'>Apply now</button></div>"
        );

        $("button.sidebar-button").click(function () {
          window.open(
            feature.properties.link,
            "_blank" // <- This is what makes it open in a new window.
          );
        });

        $(".close-button").on("click", function () {
          $("div.sidebar").removeClass("visible");
        });

        // close popup on map click
        map.on("click", function () {
          $("div.custom-popup").removeClass("visible");
        });

        // close popup on map move
        map.on("mouseup", function () {
          $("div.custom-popup").removeClass("visible");
        });

        // close popup on map touch
        map.on("touchmove", function () {
          $("div.custom-popup").removeClass("visible");
        });
      });
      // end custom second popup -
    });

    // Show the filter input
    filterEl.parentNode.style.display = "block";
  } else if (features.length === 0 && filterEl.value !== "") {
    empty.textContent = "No results found";
    listingEl.appendChild(empty);
  } else {
    // I add this part of code for not needing a map dragging to populate the results on the sidebar:
    map.fitBounds([
      [-66.94838, 47.46965],
      [-128.71732, 23.84461],
    ]);

    // empty.textContent = 'Drag the map to populate results';
    // listingEl.appendChild(empty);

    // Hide the filter input
    filterEl.parentNode.style.display = "none";

    // remove features filter
    map.setFilter("jobListing", ["has", "link"]);
  }
}

function normalize(string) {
  return string.trim().toLowerCase();
}

function getUniqueFeatures(array, comparatorProperty) {
  var existingFeatureKeys = {};
  // Because features come from tiled vector data, feature geometries may be split
  // or duplicated across tile boundaries and, as a result, features may appear
  // multiple times in query results.
  var uniqueFeatures = array.filter(function (el) {
    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
      return false;
    } else {
      existingFeatureKeys[el.properties[comparatorProperty]] = true;
      return true;
    }
  });

  return uniqueFeatures;
}

map.on("load", async () => {
  // Get the initial location of the International Space Station (jobListing).
  const geojson = await getLocation();

  map.loadImage("redpin.png", (error, image) => {
    if (error) throw error;

    // Add the image to the map style.
    map.addImage("redpin", image);
  });

  map.loadImage("greenpin.png", (error, image) => {
    if (error) throw error;

    // Add the image to the map style.
    map.addImage("greenpin", image);
  });

  // Add the jobListing location as a source.
  map.addSource("jobListing", {
    type: "geojson",
    data: geojson,
  });
  // Add the rocket symbol layer to the map.
  map.addLayer({
    id: "jobListing",
    type: "symbol",
    source: "jobListing",
    layout: {
      // This icon is a part of the Mapbox Streets style.
      // To view all images available in a Mapbox style, open
      // the style in Mapbox Studio and click the "Images" tab.
      // To add a new image to the style at runtime see
      // https://docs.mapbox.com/mapbox-gl-js/example/add-image/
      // "icon-image": ["get", getIcon("jobListing".properties.featuredJob)],
      "icon-image": ["get", "icon"],
      // "icon-image": "music-15",
    },
  });
  
  // add bounding box and fit to bounds
  var bounds = new mapboxgl.LngLatBounds();
  geojson.features.forEach(function (feature) {
    bounds.extend(feature.geometry.coordinates);
  });
  map.fitBounds(bounds, { padding: 100 });
  // end bounds

  map.on("moveend", function () {
    var features = map.queryRenderedFeatures({ layers: ["jobListing"] });

    if (features) {
      var uniqueFeatures = getUniqueFeatures(features, "name");
      // Populate features for the listing overlay.
      renderListings(uniqueFeatures);

      // Clear the input container
      // filterEl.value = "";

      // Store the current features in sn `places` variable to
      // later use for filtering on `keyup`.
      places = uniqueFeatures;
    }
  });

  // When a click event occurs on a feature in the places layer, open a popup at the
  // location of the feature, with description HTML from its properties.
  map.on("click", "jobListing", (e) => {
    console.log(e)
    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();

    var feature = e.features[0];
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
       coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(
        "<img class='first-popup' src='" +
        feature.properties.logo +
        "'></br>" +
        "<b class='first-popup'>Title: " +
        feature.properties.name +
        "</b>" +
        "<p class='first-popup'>Company: " +
        feature.properties.company +
        "</p><p class='first-popup'>Job Type: " +
        feature.properties.jobType +
        "</p>" +
        "<button class='first-popup'>See more</button>"
      )
      .addTo(map);

    // start custom second popup - sidebar
    $("button.first-popup").on("click", function () {
      $("div.sidebar").addClass("visible");
      $("div.sidebar").html(
        '<div class="sidebar-content"><span class="close-button"> X</span><div class="sidebar-content-inner">' +
        "<img class='sidebar-image' src='" +
        feature.properties.logo +
        "'></br>" +
        "<b class='sidebar-bold'>Title: " +
        feature.properties.name +
        "</b>" +
        "<p class='sidebar-paragraph'>Company: " +
        feature.properties.company +
        "</p><p class='sidebar-paragraph'>Job Type: " +
        feature.properties.jobType +
        "</p>" +
        "<p class='sidebar-paragraph'>Salary: " +
        feature.properties.salary +
        "</p>" +
        "<p class='sidebar-paragraph'>Location: " +
        feature.properties.location +
        "</p>" +
        "<p class='sidebar-paragraph'>Date Posted: " +
        feature.properties.postingDate +
        "</p>" +
        "<button class='sidebar-button'>Apply now</button></div>"
      );

      $("button.sidebar-button").click(function () {
        console.log('apply button clicked');
        mixpanel.track('Apply Button Clicked',{
        'link':feature.properties.link,
        'Name':feature.properties.name,
        'Company':feature.properties.company,
        'jobCity':feature.properties.city,
         'jobState':feature.properties.state
        });
        window.open(
          feature.properties.link,
          "_blank" // <- This is what makes it open in a new window.
        );
      });

      $(".close-button").on("click", function () {
        $("div.sidebar").removeClass("visible");
      });

      // close popup on map click
      map.on("click", function () {
        $("div.custom-popup").removeClass("visible");
      });

      // close popup on map move
      map.on("mouseup", function () {
        $("div.custom-popup").removeClass("visible");
      });

      // close popup on map touch
      map.on("touchmove", function () {
        $("div.custom-popup").removeClass("visible");
      });
    });
    // end custom second popup -
  });
  
  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on("mouseenter", "jobListing", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // // Change it back to a pointer when it leaves.
  map.on("mouseleave", "jobListing", () => {
    map.getCanvas().style.cursor = "";
  });

  // map.on("mousemove", "jobListing", function (e) {
  //   // Change the cursor style as a UI indicator.
  //   map.getCanvas().style.cursor = "pointer";

  //   // Populate the popup and set its coordinates based on the feature.
  //   var feature = e.features[0];
  //   popup
  //     .setLngLat(feature.geometry.coordinates)
  //     .setHTML(
  //       "<img src='" +
  //         feature.properties.logo +
  //         "'>" +
  //         "<b>Title: " +
  //         feature.properties.name +
  //         "</b></br>" +
  //         "<p>Company: " +
  //         feature.properties.company +
  //         "</p><p>Job Type: " +
  //         feature.properties.jobType +
  //         "</p>" +
  //         "<button style='background-color:#007922'>See full details</button>"
  //     )
  //     .addTo(map);
  // });

  map.on("mouseleave", "jobListing", function () {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });  
  
  filterEl.addEventListener("keyup", function (e) {
    var value = normalize(e.target.value);

    // Filter visible features that don't match the input value.
    var filtered = places.filter(function (feature) {
      var name = normalize(feature.properties.name);
      var company = normalize(feature.properties.company);
      var location = normalize(feature.properties.location);
      return name.indexOf(value) > -1 || company.indexOf(value) > -1 || location.indexOf(value) > -1;
    });

    // Populate the sidebar with filtered results
    renderListings(filtered);

    // Set the filter to populate features into the layer.
    if (filtered.length) {
      map.setFilter("jobListing", [
        "match",
        ["get", "name"],
        filtered.map(function (feature) {
          return feature.properties.name;
        }),
        true,
        false,
      ]);
    }
  });

  // Call this function on initialization
  // passing an empty array to render an empty state
  renderListings([]);

  // Update the source from the API every 2 seconds.
  // const updateSource = setInterval(async () => {
  //   const geojson = await getLocation(updateSource);
  //   map.getSource("jobListing").setData(geojson);
  // }, 2000);

  // async function getLocation(updateSource) {
  async function getLocation() {
    // Make a GET request to the API and return the location of the jobListing.
    try {
      const response = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets/1HgNgglwfir_4Yk_0Y0T6HTLnmbXS98xJj5ngkBeZFk0/values/Sheet1!A2:U1000?majorDimension=ROWS&key=AIzaSyAFSAoTB2EKtPat2aMuMIEXuM44EoDcXIo",
        { method: "GET" }
      );

      const responseGeojson = await response.json();

      // Fly the map to the location.
      // map.flyTo({
      //   center: [-81.49102, 41.08813],
      //   zoom: 2,
      // });

      var myGeoJSON = {};
      // Return the location of the jobListing as GeoJSON.
      myGeoJSON.type = "FeatureCollection";
      myGeoJSON.crs = {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
      };
      myGeoJSON.features = [];

      function addDataToArray(item) {
        var longitude = item[15];
        var latitude = item[16];
        var companyLogo = item[20];
        if (item[20]) {
          companyLogo = companyLogo.replace("open?id=", "uc?id=");
          companyLogo = companyLogo.replace("/view?usp=sharing", "");
        }

        var markerIcon = "";
        if (item[1] === "Yes") {
          markerIcon = "redpin";
        } else {
          markerIcon = "greenpin";
        }

        var jsonObject = {
          type: "Feature",
          properties: {
            id: item[0],
            featuredJob: item[1],
            postingDate: item[3],
            name: item[4], // posting title (job title)
            company: item[5],
            jobType: item[7],
            salary: item[8],
            location: item[9],
            link: item[18],
            logo: companyLogo,
            icon: markerIcon,
          },
          geometry: {
            type: "Point",
            coordinates: [latitude, longitude],
          },
        };
        myGeoJSON.features.push(jsonObject);
      }
      responseGeojson.values.forEach(addDataToArray);
      return myGeoJSON;
    } catch (err) {
      // If the updateSource interval is defined, clear the interval to stop updating the source.
      if (updateSource) clearInterval(updateSource);
      throw new Error(err);
    }
  }
  
  function hideLoader() {
    $('#loading').hide();
}

$(window).ready(hideLoader);

// Strongly recommended: Hide loader after 20 seconds, even if the page hasn't finished loading
setTimeout(hideLoader, 20 * 1000);
});
