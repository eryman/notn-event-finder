/*window.fbAsyncInit = function() {
      FB.init({
        appId      : '249451612156174',
        status     : true,
        xfbml      : true,
        version    : 'v2.8'
      });
    };*/ 
    
    /*(function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "//connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));*/

var model = {
  eventsList: [],
  months: [' ','January','February','March','April','May','June','July','August','September','October','November','December']
}

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
  //this.marker = a whole other mess of problems;
};

var helper = {
  // Adds an event to model.eventsList
  addToEventsList: function(event){
    model.eventsList.push(event)
  },
  // Retrieves model.eventsList
  getEventsList: function(){
    return model.eventsList;
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
}

var facebookView = {
  // Retrieves facebook resources, calls populateNav to populate the nav window
  init: function(){
    var self = this;
    var u = 'https://graph.facebook.com/oauth/access_token?client_id=249451612156174&client_secret=441f73560f430d7dbcfbd64b63624345&grant_type=client_credentials';
    var pageId = '448341978638831';
    var fields = 'events';
    var ul = 'https://graph.facebook.com/' + pageId + '?' + 'fields=' + fields + '&';     
    $.get(u, function(auth_token){
      $.ajax({
        dataType: "jsonp",
        url: ul + auth_token,
        success: function(response) {
          if (response) {
            var eventData = response.events.data;
            var i = 0;
            eventData.forEach(function(event){
              helper.addToEventsList(new Event(event));
              self.populateNav(helper.getEventsList()[i], i);
              i++
            });
            console.log(helper.getEventsList());
          } else {
            window.alert('Could not load resources');
          }
        },
        error: function(){
          window.alert('Could not load resources');
        }
      })
    })
  },
  // Takes an event object, adds markup and appends to nav bar
  populateNav: function(eventData, i){
    if (i % 2 == 0) {
      $('nav').append('<div class="nav__item gray"></div>');
    } else {
      $('nav').append('<div class="nav__item"></div>');
    }
    $('.nav__item:last').append('<h3>' + eventData.name + '</h3>');
    if(eventData.venue){
      $('.nav__item:last').append('<p>' + eventData.venue + ' - <span>' + eventData.address + '</span>');
    }
    $('.nav__item:last').append('<p>' + eventData.date + '</p>');
    $('.nav__item:last').append('<p>' + eventData.description + '</p>');
    $('.nav__item:last').append('<p>Click <a href="' + eventData.url + '">here</a> to visit Facebook event page!</p>');

  }
} 

var mapView = {
    initMap: function() {
        // Initialize the map, the list of markers, and the info window
        helper.setMap();
        //helper.setMarkers();
        //helper.setInfowindow();
    },
    handleError: function() {
        window.alert("Map could not be loaded.");
    }
};

// When the doc is ready, initialize facebook resources
$(document).ready(function(){
  facebookView.init();
})