var oauth = require('oauth-client'),
    qs = require('querystring'),
    geohash = require('geohash').GeoHash;

String.format = function(str,obj){
	return str.replace(/\%{\w+}/g, function(str, p1, p2, offset, s) {
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
  var c = new SimpleGeoClient(key,secret);
  return c;
}

function SimpleGeoClient(key,secret) {

  var consumer = oauth.createConsumer(key,secret);

  this.signer = oauth.createHmac(consumer);
  this.http = oauth.createClient(80,simplegeo.base);
}

SimpleGeoClient.prototype.addRecord = function(record, callback) {
  url = String.format(simplegeo.endpoints.record, {
      layer: record.layer,
      id: record.id
  });
  
  return this.prepare('PUT', url, record.encode(), callback);
};

SimpleGeoClient.prototype.addRecords = function(layer, records, callback) {
  url = String.format(simplegeo.endpoints.addRecords, {
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
  
  return this.prepare('POST', url, body, callback);
};

SimpleGeoClient.prototype.deleteRecord = function(layer, id, callback) {
  url = String.format(simplegeo.endpoints.deleteRecord, {
    id: id
  });
  
  return this.prepare('DELETE', url, null, callback);
};

SimpleGeoClient.prototype.getRecord = function(layer, id, callback) {
  url = String.format(simplegeo.endpoints.record, {
    id: id
  });
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getRecords = function(layer, ids, callback) {
  url = String.format(simplegeo.endpoints.record, {
    id: ids.join(','),
    layer: layer
  });
  
  return this.prepare('GET', url, null, callback)
};

SimpleGeoClient.prototype.getHistory = function(layer, id, callback) {
  url = String.format(simplegeo.endpoints.history, {
    id: id,
    layer: layer
  });
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getNearby = function(layer, lat, lon, args, callback) {
  url = String.format(simplegeo.endpoints.nearby, {
    layer: layer,
    geohash: geohash.encodeGeoHash(lat,lon)
  });
  
  if (args)
    url += '?' + qs.stringify(args);
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getNearbyAddress = function(lat, lon, callback) {
  url = String.format(simplegeo.endpoints.nearbyAddress, {
    lat: lat,
    lon: lon
  });
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getLayer = function(layer, callback) {
  url = String.format(simplegeo.endpoints.layer, {
    layer: layer
  });
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getDensity = function(lat, lon, day, hour, callback) {
  var endpoint = simplegeo.endpoints.densityDay;
  if (hour) endpoint = simplegeo.endpoints.densityHour;

  url = String.format(endpoint, {
    lat: lat,
    lon: lon,
    day: day,
    hour: hour
  });
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getOverlaps = function(south, west, north, east, args, callback) {
  url = String.format(simplegeo.endpoints.overlaps, {
    south: south,
    west: west,
    north: north,
    east: east
  });
  
  if (args)
    url += '?' + qs.stringify(args);
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getBoundary = function(id, args, callback) {
  url = String.format(simplegeo.endpoints.boundary, {
    id: id
  });
  
  if (args)
    url += '?' + qs.stringify(args);
  
  return this.prepare('GET', url, null, callback);
};

SimpleGeoClient.prototype.getContains = function(lat, lon, callback) {
  url = String.format(simplegeo.endpoints.contains, {
    lat: lat,
    lon: lon
  });
  
  return this.prepare('GET', url, null, callback);
}

//The oauth lib cannot properly subclass http.Client so I have to resort to this
//instead of overridding the request method
SimpleGeoClient.prototype.prepare = function(method, path, body, callback) {
  
  var headers = {
    'Content-Type':'application/json'
  };
  
  if (body) {
    body = JSON.stringify(body);
    headers['Content-Length'] = body.length;
  }    

  path = '/' + simplegeo.version + path;
  
  var req = this.http.request(method, path, headers, null, this.signer);
  var data = '';

  req.addListener('response', function(response) {
    response.addListener('data', function(chunk) { data+=chunk });
    response.addListener('end', function() { callback(response,data) });
  });
  
  if (body) req.write(body);
  req.end();
  
  return req;
}

exports.SimpleGeoClient = SimpleGeoClient;
