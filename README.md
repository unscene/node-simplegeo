
# Overview
A simple [SimpleGeo](http://simplegeo.com/) client.  The library draw a lot off of the official [python client](http://github.com/simplegeo/python-simplegeo), so usage should be almost identical.

Make sure I have not missed anything by visiting [here](https://simplegeo.zendesk.com/entries/208976-api-endpoints)

# Installation
You can be fancy and clone the repo from here, or install [npm](http://github.com/isaacs/npm) and run:

	npm install simplegeo

The include you must specify, if using the npm install:

	require('simplegeo')
	
If you do not install through npm, please be aware that this library depends on [geohash](http://github.com/unscene/geohash-js) and [oauth-client](http://github.com/unscene/node-oauth).

#Usage

Again, the usage is similar to the official python client.  The main difference is the fact that the calls are all asynchronous, which results in you having to pass in callbacks.

The callback will provide a *response* object and *data* object:

	function someCallback(response,data)

## Creating a client
Creating a client involves providing your API key and token.  Get them [here](http://simplegeo.com/account/settings/)

	client = simplegeo.createClient('key','secret')

## Adding a record

Adding a record or records is easy. Simply create a record object:

	var record = simplegeo.createRecord('com.yourlayer',1,28.541647,-81.369874);

The parameters are: layer, id, lon, lat, type, created, props.  'Props' should be an object.  You do not have to specify a created time, as it will get auto populated to the correct format in ticks.

Then it just involves sending that record off.

	client.addRecord(record,someCallback);
	
## Adding multiple records

To add multiple records just entails adding specifying the layer, an array of records, and a callback:

	client.addRecords('com.yourlayer',records,someCallback)

*Note:* All records in the array should have a uniform layer, I set them to be the layer provided just in case

## Getting/Deleting a record and History

Deleting and getting have the same method signature and expect a layer, id and callback:

	client.getHistory('com.yourlayer',300,someCallback)

## Getting multiple records

Multiple records simply expect an array of ids to find:

	client.getRecords('com.yourlayer',[100,101],someCallback)

## Getting nearby records

Nearby records have two different methods: #getNearby and #getNearbyAddress.  From what I can tell #getNearby is the preferred method. Both act the same except for #getNearby takes additional args:

	client.getNearby('com.yourlayer',28.541647, -81.369874,{limit:10},this.callback)

For getNearbyAddress just omit the additional args.

## Getting a layer

Simplest of the bunch, just provide the layer name.

## Getting density

The only thing to note here is that two different endpoints are called depending on if you specify a day and/or hour.  The formats for the days are: mon, tue, wed, thu, fri, sat, or sun, and hours are 0-23.

## Overlaps

With #getOverlaps you can find what data is in a specific quadrant.  A quadrant is made up of south, west, north and east.  You can also pass additional query parameter as the next to last argument.

## Contains

You can find out what a specific lat and lon contain by using #getContains.  Simply provide a lat, lon and callback.

## Boundary data

You can find what is in a specific boundary by providing an id to the method. 

*Note:* The id must be the id returned froma a #getContains call, it is not numeric.

# Tests
I am not sure the total code coverage of the tests at this point, but it is quickly getting there.Running the tests requires vows.  See [vows](http://vowsjs.org/) to get started.

Once installed:

	vows test\*

## License 

(The MIT License)

Copyright (c) 2009 Ryan Fairchild &lt;ryan.fairchild [at] gmail [dot] com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.