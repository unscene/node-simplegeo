var simplegeo = require('../lib/simplegeo'),
		sys = require('sys'),
		vows = require('vows'),
		assert = require('assert'),
		http = require('http');

//Vows Macros
function assertStatus(status) {
	return function (response, data) {
    assert.equal(response.statusCode,status);
	}
}

var layer = 'com.unscene';
var client = simplegeo.createClient('8XeBKHXFepW8Z7ZSJHGZ3HaVwSHtTzcV','pSQMgfeUFSS9cTbw7CPuuv7vXW4LxNuD');

//Tests
exports.endpointRecords = vows.describe('endpoint-records')
	.addBatch({
	  'Adding a record': {
	    'without a type, creation date or extra properties':{
	      topic: function() {
	        var record = new simplegeo.Record(layer,100 + Math.random() * 100, 28.541647, -81.369874);
	        client.addRecord(record,this.callback);
	      },
	      'should return a status code 202': assertStatus(202),
	    },
	    'with a type, creation date and extra properties': {
	      topic: function() {
	        var record = new simplegeo.Record(layer,100 + Math.random() * 100, 28.541647, -81.369874, 'Point', 
	          Math.floor(new Date().getTime / 1000), {
	            test: 'test'
	          });
	        client.addRecord(record,this.callback);
	      },
	      'should return a status 202': assertStatus(202)
	    }
    },
    'Adding mutliple records': {
      topic: function() {
        
        var records = [];
        for (var i=0; i < 10; i++) {
          records.push(new simplegeo.Record(layer,300 + i, 28.541647, -81.369874, 'Point', 
    	      Math.floor(new Date().getTime / 1000), {
    	        test: 'test'
    	      }));
	      }
	      
	      client.addRecords('com.unscene',records,this.callback);
      },
      'should return a status 202': assertStatus(202)
    },
    'Getting multiple records': {
      topic: function() {
        client.getRecords(layer,[100,101],this.callback)
      },
      'should return a 200 status': assertStatus(200)
    },
    'Getting the history of a record': {
      topic: function() {
        client.getHistory(layer,300,this.callback)
      },
      'should return a status 200': assertStatus(200)
    },
    'Getting nearby records': {
      topic: function() {
        client.getNearby(layer,28.541647, -81.369874,null,this.callback)
      },
      'should return a 200 status': assertStatus(200)
    },
    'Getting nearby records by address':{
      topic: function() {
        client.getNearbyAddress(28.541647, -81.369874,this.callback)
      },
      'should return a status 200': assertStatus(200)
    },
    'Getting a layer': {
      topic: function() {
        client.getLayer(layer,this.callback);
      },
      'should return a status 200': assertStatus(200)
    },
    'Getting the density of an area by day': {
      topic: function() {
        client.getDensity(28.541647, -81.369874,'sat',null,this.callback)
      },
      'should return a status 200': assertStatus(200)
    },
    'Getting the density of an area by day and hour': {
      topic: function() {
        client.getDensity(28.541647, -81.369874,'sat',17,this.callback)
      },
      'should return a status 200': assertStatus(200)
    },
    'Get overlapping areas of the specified quadrant': {
      topic: function() {
        client.getOverlaps(-122.43409, 37.747296999999996, -122.424768, 37.751841999999996,null,this.callback)
      },
      'should return a status 200': assertStatus(200)
    },
    'Get container data for the specifed lat and lon': {
      topic: function() {
        client.getContains(28.541647, -81.369874,this.callback)
      },
      'should return a status 200': assertStatus(200)
    },
    'Get boundary data for the specifed id': {
      topic: function() {
        client.getBoundary('County:Wayne:dpsb93',null,this.callback)
      },
      'should return a status 200': assertStatus(200)
    }
});

exports.utilities = vows.describe('utilities')
	.addBatch({
		'String formatter': {
		  topic: function(){ return "%{lat},%{long}".format({
		      lat:1,
		      long:1
		    }) 
		  },
		  'should replace any tokens by name from the provided object': function(result) {
			  assert.equal(result,"1,1");
		  }
	  }
});
