  /*window.fbAsyncInit = function() {
        FB.init({
          appId      : '249451612156174',
          status     : true,
          xfbml      : true,
          version    : 'v2.8'
        });
      };*/ 
      
      var model = {
        eventsList: [],
        months: [' ','January','February','March','April','May','June','July','August','September','October','November','December']
      }
      
      var Event = function(data){
        this.name = data.name;
        if (data.place){
          this.venue = data.place.name;
          this.address = data.place.location.city + ', ' + data.place.location.state + ', ' + data.place.location.zip;
        };
        this.date = model.months[parseInt(data.start_time.substring(5, 7))] + ' ' + data.start_time.substring(8, 10) + ', ' + data.start_time.substring(0,4);
        this.time = data.start_time.substring(10);
        this.description = data.description;
        this.url = 'https://www.facebook.com/events/' + data.id;
      };
      
      $(document).ready(function(){
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
                  model.eventsList.push(new Event(event));
                  $('nav').append('<h3>' + model.eventsList[i].name + '</h3>');
                  i++
                });
                console.log(model.eventsList);
              } else {
                window.alert('Could not load resources');
              }
            },
            error: function(){
              window.alert('Could not load resources');
            }
          })
        })
      }) 


      /*(function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s); js.id = id;
         js.src = "//connect.facebook.net/en_US/sdk.js";
         fjs.parentNode.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));*/




