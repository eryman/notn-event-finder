var model = {
  eventsList: [],
  upcomingEvents: [],
  previousEvents: [],
  bounds: null,
  largeInfowindow: null,
  months: [' ','January','February','March','April','May','June','July','August','September','October','November','December']
}

// Takes event information from a Facebook page and turns it into an Event object
var Event = function(data){
  this.name = data.name;
  this.id = data.id;
  if (data.place){
    this.venue = data.place.name;
    this.address = data.place.location.city + ', ' + data.place.location.state;
  };
  this.date = model.months[parseInt(data.start_time.substring(5, 7))] + ' ' + data.start_time.substring(8, 10) + ', ' + data.start_time.substring(0,4);
  this.time = data.start_time.substring(10);
  this.description = data.description;
  this.url = 'https://www.facebook.com/events/' + data.id;
  this.marker = null;
  this.windowAddress = null;
  this.windowPhone = null;
};

var helper = {
  setInfowindow: function() {
    model.largeInfowindow = new google.maps.InfoWindow();
  },
  getInfowindow: function() {
    return model.largeInfowindow;
  },
  populateInfoWindow: function(marker, address, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      //console.log(marker);
      infowindow.marker = marker;
      infowindow.setContent('<div>' + marker.title + '</div>');
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.setMarker(null);
      });
      var streetViewService = new google.maps.StreetViewService();
      var radius = 50;
      // In case the status is OK, which means the pano was found, compute the
      // position of the streetview image, then calculate the heading, then get a
      // panorama from that and set the options
      function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
          var nearStreetViewLocation = data.location.latLng;
          var heading = google.maps.geometry.spherical.computeHeading(
            nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.title + '<br>' + address.substring(0, address.length-15) + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
          var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
        } else {
          infowindow.setContent('<div>' + marker.title + '</div>' +
              '<div>No Street View Found</div>');
        }
      }
      // Use streetview service to get the closest streetview image within
      // 50 meters of the markers position
      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }
  },
  addToEventsList: function(event, eventsList){
    eventsList.push(event)
  },
  // Adds an event to model.eventsList
  addToUpcomingEvents: function(event){
    model.upcomingEvents.push(event)
  },  
  addToPreviousEvents: function(event){
    model.previousEvents.push(event)
  },
  // Retrieves model.eventsList
  getUpcomingEvents: function(){
    return model.upcomingEvents;
  },
  getPreviousEvents: function(){
    return model.previousEvents;
  },
  replaceEventsOnClick: function(inList, outList){
    i = 0;
    $('.nav__item').remove();
    $('.events-header').remove();
    if (inList === helper.getUpcomingEvents()) {
      $('.nav').append('<h2 class="events-header">Upcoming Events</h2>');
    } else {
      $('.nav').append('<h2 class="events-header">Previous Events</h2>');
    }
    inList.forEach(function(event){
      facebookView.populateNav(event, i);
      i++;
    });
    helper.hideMarkers(outList)
    helper.setMarkers(inList);
    $('.nav__item').on('click', function() {
      $(this).children('div').slideToggle();
    });
  },
  setMap: function() {
    model.map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: 40.8649,
        lng: -73.1302
      },
      zoom: 13,
      styles: model.styles
    });
  },
  getMap: function(){
    return model.map;
  },
  setBounds: function(){
    model.bounds = new google.maps.LatLngBounds();
  },
  getBounds: function(){
    return model.bounds;
  },
  setMarkers: function(eventsList){
    this.setBounds();
    var self = this;
    // For each item on eventsList
    eventsList.forEach(function(event){
      // Get name and city of each location
      var venueName = event.venue;
      // Perform google places search with that info - go to google maps API site to figure out how to do this
      self.textSearchPlaces(venueName, event);
        // In call back method
          // Create a marker with that location's coordinates
          // Add that marker information to that event's marker field
    });
  },
  hideMarkers: function(eventsList){
    if (eventsList.length > 0){
      eventsList.forEach(function(event){
        //markers[i].setMap(null);
        //console.log(event);
        event.marker.setVisible(false);
      });
    }
  },
  createMarker: function(results, event){
    var self = this;     
    var marker = new google.maps.Marker({
      position: results[0].geometry.location,
      map: this.getMap(),
      title: results[0].name,
      animation: google.maps.Animation.DROP
    });
    event.marker = marker;
    marker.addListener('click', function() {
      self.populateInfoWindow(this, event.windowAddress, self.getInfowindow());
    });
    this.getBounds().extend(marker.position);
    this.getMap().fitBounds(this.getBounds());
  },
  textSearchPlaces: function(venueName, event) {
    var self = this;
    var placesService = new google.maps.places.PlacesService(this.getMap());
    //console.log('working?')
    placesService.textSearch({
      query: venueName
    }, function(results, status) {
      console.log(results);
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        event.windowAddress = results[0].formatted_address;
        //event.windowPhone = 
        self.createMarker(results, event);
      }
      else {
        console.log('failed');
      }
    });
  }
}

var facebookView = {
  // Retrieves facebook resources, calls populateNav to populate the nav window
  init: function(){
    var self = this;
    //var u = 'https://graph.facebook.com/oauth/access_token?client_id=249451612156174&client_secret=441f73560f430d7dbcfbd64b63624345&grant_type=client_credentials';
    var pageId = '448341978638831';
    var fields = 'name,events';
    var ul = 'https://graph.facebook.com/' + pageId + '?' + 'fields=' + fields + '&' + 'time_format=U' + '&'; 
    var auth_token = 'access_token=249451612156174|2OUYlgg72N41S9NrFzm7t6d7cDg';
    //$.get(u, function(auth_token){
      //console.log(auth_token);
      $.ajax({
        dataType: "jsonp",
        url: ul + auth_token,
        //time_format: U,
        success: function(response) {
          if (response) {
            console.log(response.name);
            $('h1').prepend(response.name);
            var eventData = response.events.data;
            var i = 0;
            eventData.forEach(function(event){
              //DELETE THE NEXT LINE ONCE THE FB BUG IS FIXED
              if (event.hasOwnProperty("place")) {
                if (event.start_time > Date.now){
                  helper.addToEventsList(new Event(event), helper.getUpcomingEvents());
                } else {
                  helper.addToEventsList(new Event(event), helper.getPreviousEvents());
                  //self.populateNav(helper.getPreviousEvents()[i], i);
                }
              }
            });
            console.log(helper.getUpcomingEvents());
            console.log(helper.getPreviousEvents());
            // ADD UPCOMING EVENTS LIST TO NAV
            // IF ITS EMPTY, DO PREVIOUS INSTEAD
            if (helper.getUpcomingEvents().length > 0) {
              $('.nav').append('<h2 class="events-header">Upcoming Events</h2>');
              helper.getUpcomingEvents().forEach(function(event){
                self.populateNav(event, i);
                i++;
                $('.nav__item--title:last').click(function() {
                  helper.populateInfoWindow(event.marker, event.windowAddress, helper.getInfowindow());
                  $(this).children('div').slideToggle();
                  helper.populateInfoWindow(event.marker, event.windowAddress, helper.getInfowindow());
                });
              });
            } else {
              $('.nav').append('<h2 class="events-header">Previous Events</h2>');
              helper.getPreviousEvents().forEach(function(event){
                self.populateNav(event, i);
                i++;
                $('.nav__item:last').click(function() {
                  helper.populateInfoWindow(event.marker, event.windowAddress, helper.getInfowindow());
                  $(this).children('div').slideToggle();
                  helper.populateInfoWindow(event.marker, event.windowAddress, helper.getInfowindow());
                });
              });
            }
            helper.setMarkers(helper.getPreviousEvents());
            helper.setMarkers(helper.getUpcomingEvents());
            helper.getPreviousEvents().forEach(function(event){
              console.log(event);
            });
          } else {
            window.alert('Could not load resources');
          };
          // Create click event that will display the event's description
          $('#upcoming-button').on('click', function(){
            helper.getPreviousEvents().forEach(function(event){
              helper.getInfowindow().close(helper.getMap(), event.marker);  
            })
            helper.replaceEventsOnClick(helper.getUpcomingEvents(), helper.getPreviousEvents())
          });
          $('#previous-button').on('click', function(){
            helper.getUpcomingEvents().forEach(function(event){
              helper.getInfowindow().close(helper.getMap(), event.marker);  
            })
            helper.replaceEventsOnClick(helper.getPreviousEvents(), helper.getUpcomingEvents())
          })
        },
        error: function(){
          window.alert('Could not load resources');
        }
      })
  },
  // Takes an event object, adds markup and appends to nav bar
  populateNav: function(eventData, i){
    console.log(eventData.name);
    console.log(eventData.id);
    if (i % 2 == 0) {
      $('nav').append('<div class="nav__item gray"></div>');
    } else {
      $('nav').append('<div class="nav__item"></div>');
    }
    $('.nav__item:last').append('<h3 class="nav__item--title">' + eventData.name + '</h3>');
    if(eventData.venue){
      $('.nav__item:last').append('<p>' + eventData.venue + ' - <span>' + eventData.date + '</span>');
    }
    $('.nav__item:last').append('<div class="nav__item--body"></div>');
    $('.nav__item--body:last').append('<p>' + eventData.address + '</p>');
    var lines = eventData.description.split('\n')
    lines.forEach(function(line){
      $('.nav__item--body:last').append('<p>' + line + '</p>');
    })
    $('.nav__item--body:last').append('<p>Click <a href="' + eventData.url + '">here</a> to visit Facebook event page!</p>');
    // Hides non-essential information
    $('.nav__item--body').hide();
    // Adds a click event on each event name that displays an infowindow
    $('.nav__item:last').click(function() {
      helper.populateInfoWindow(eventData.marker, eventData.windowAddress, helper.getInfowindow());
    });
  }
} 


var mapView = {
  // Initialize the map, the list of markers, and the info window. To be called in facebookView.init()
  initMap: function() {
      helper.setMap();
      //console.log(helper.getEventsList());
      //helper.setMarkers(helper.getEventsList());
      helper.setInfowindow();
  },
  handleError: function() {
      window.alert("Map could not be loaded.");
  }
};

// When the doc is ready, initialize facebook resources
$(document).ready(function(){
  facebookView.init();
})

//console.log(new Date('2014','03','08'));

// TODO: put initMap function at the end of facebookView.init callback function to make sure it doesn't load until facebook resources are retrieved.

// TODO: Delete line 144(ish)

/* TODO:
 *
 * Wire event items to markers - LINE 262 -OR- fuck around with line 309 until it works - check viewmodel.js to figure out what you did last time
 * HEADERS FOR PREVIOUS/UPCOMING EVENTS
 */

