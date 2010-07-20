var oauth = require('oauth-client'),
    qs = require('querystring'),
    geohash = require('geohash').GeoHash;

String.prototype.format = function(obj){
	return this.replace(/\%{\w+}/g, function(str, p1, p2, offset, s) {
		return obj[str.replace(/[\%\{\}]/g,'')];
	});
};

var simplegeo = exports;

simplegeo.base = 'api.simplegeo.com';

simplegeo.version = '0.1';

simplegeo.endpoints = {
  record: '/records/%{layer}/%{id}.json',
  records: '/records/%{layer}/%{ids}.json',
  addRecords: '/records/%{layer}.json',
  history: '/records/%{layer}/%{id}/history.json',
  nearby: '/records/%{layer}/nearby/%{geohash}.json',
  nearbyAddress: '/nearby/address/%{lat},%{lon}.json',
  densityDay: '/density/%{day}/%{lat},%{lon}.json',
  densityHour: '/density/%{day}/%{hour}/%{lat},%{lon}.json',
  layer: '/layer/%{layer}.json',
  contains: '/contains/%{lat},%{lon}.json',
  overlaps: '/overlaps/%{south},%{west},%{north},%{east}.json',
  boundary: '/boundary/%{id}.json'
}

exports.createRecord = function(layer, id, lon, lat, type, created, props) {
  var r = new Record();
  r.layer = layer;
  r.id = id;
  r.lat = lat;
  r.lon = lon;
  r.type = type || 'Point';
  r.created = created || Math.floor(new Date().getTime() / 1000);
  r.props = props || {};

  return r;
}

function Record() {}

exports.Record = Record;

Record.prototype.encode = function() {
  return {
    type: 'Feature',
    id: this.id.toString(),
    created: this.created,
    geometry: {
      type: this.type,
      coordinates: [this.lon,this.lat]
    },
    properties: this.props
  };
}

Record.prototype.decode = function(data) {
  if (!data) return null;
  
  data = JSON.parse(data);
  
  coords = data.geometry.coordinates;
  record = new Record(data.geometry.layer, data.id, coord[0], coord[1],
    data.created, data.geometry.type);
  record.props = data.properties;
  
  return record;
}

exports.createClient = function(key, secret) {
  var consumer = oauth.createConsumer(key,secret);
  var signer = oauth.createHmac(consumer);
  
  var c = oauth.createClient(80,simplegeo.base);
  
  c.addRecord = function(record, callback) {
    url = simplegeo.endpoints.record.format({
        layer: record.layer,
        id: record.id
    });
    
    return c._request('PUT', url, record.encode(), callback);
  };
  
  c.addRecords = function(layer, records, callback) {
    url = simplegeo.endpoints.addRecords.format({
      layer: layer,
    });
    
    var body = {
      type: 'FeatureCollection',
      features: []
    }
    
    for (var record in records) {
      if (typeof(records[record]) == 'function') continue;
      records[record].layer = layer;
      body.features.push(records[record].encode());
    }
    
    return c._request('POST', url, body, callback);
  };
  
  c.deleteRecord = function(layer, id, callback) {
    url = simplegeo.endpoints.deleteRecord.format({
      id: id
    });
    
    return c._request('DELETE', url, null, callback);
  };
  
  c.getRecord = function(layer, id, callback) {
    url = simplegeo.endpoints.record.format({
      id: id
    });
    
    return c._request('GET', url, null, callback);
  };
  
  c.getRecords = function(layer, ids, callback) {
    url = simplegeo.endpoints.record.format({
      id: ids.join(','),
      layer: layer
    });
    
    return c._request('GET', url, null, callback)
  };
  
  c.getHistory = function(layer, id, callback) {
    url = simplegeo.endpoints.history.format({
      id: id,
      layer: layer
    });
    
    return c._request('GET', url, null, callback);
  };
  
  c.getNearby = function(layer, lat, lon, args, callback) {
    url = simplegeo.endpoints.nearby.format({
      layer: layer,
      geohash: geohash.encodeGeoHash(lat,lon)
    });
    
    if (args)
      url += '?' + qs.stringify(args);
    
    return c._request('GET', url, null, callback);
  };
  
  c.getNearbyAddress = function(lat, lon, callback) {
    url = simplegeo.endpoints.nearbyAddress.format({
      lat: lat,
      lon: lon
    });
    
    return c._request('GET', url, null, callback);
  };
  
  c.getLayer = function(layer, callback) {
    url = simplegeo.endpoints.layer.format({
      layer: layer
    });
    
    return c._request('GET', url, null, callback);
  };
  
  c.getDensity = function(lat, lon, day, hour, callback) {
    var endpoint = simplegeo.endpoints.densityDay;
    if (hour) endpoint = simplegeo.endpoints.densityHour;

    url = endpoint.format({
      lat: lat,
      lon: lon,
      day: day,
      hour: hour
    });
    
    return c._request('GET', url, null, callback);
  };
  
  c.getOverlaps = function(south, west, north, east, args, callback) {
    url = simplegeo.endpoints.overlaps.format({
      south: south,
      west: west,
      north: north,
      east: east
    });
    
    if (args)
      url += '?' + qs.stringify(args);
    
    return c._request('GET', url, null, callback);
  };
  
  c.getBoundary = function(id, args, callback) {
    url = simplegeo.endpoints.boundary.format({
      id: id
    });
    
    if (args)
      url += '?' + qs.stringify(args);
    
    return c._request('GET', url, null, callback);
  };
  
  c.getContains = function(lat, lon, callback) {
    url = simplegeo.endpoints.contains.format({
      lat: lat,
      lon: lon
    });
    
    return c._request('GET', url, null, callback);
  }
  
  //The oauth lib cannot properly subclass http.Client so I have to resort to this
  //instead of overridding the request method
  c._request = function(method, path, body, callback) {
    
    var headers = {
      'Content-Type':'application/json'
    };
    
    if (body) {
      body = JSON.stringify(body);
      headers['Content-Length'] = body.length;
    }    

    path = '/' + simplegeo.version + path;
    
    var req = c.request(method, path, headers, null, signer);
    var data = '';

    req.addListener('response', function(response) {
      response.addListener('data', function(chunk) { data+=chunk });
      response.addListener('end', function() { callback(response,data) });
    });

    if (body) req.write(body);
    req.end();
    
    return req;
  }
  
  return c;
}
