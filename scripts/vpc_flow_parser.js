'use strict'

const _ = require('underscore');
const fs = require('fs');
const parse = require('csv-parse');
const AWS = require('aws-sdk');
const async = require('async');
const awsEC2 = new AWS.EC2({
    region: 'us-west-2'
});
const data = fs.readFileSync('./sample_vpc_flow.log','utf8')

function constructVizceralNodesJSONData (nodes, ipDictionary) {
	var jsonData = _.map(nodes, function (node) {
		return {
			name: ipDictionary[node] ? ipDictionary[node] : node,
			renderer: 'focusedChild',
			class: 'normal'
		};
	});

	return jsonData;
}

function constructVizceralConnectionsJSONData (connections, ipDictionary) {
	var jsonData = _.map(connections, function (connection) {
		var source = connection.split(';')[0];
		var target = connection.split(';')[1];

		return {
			source: (ipDictionary[source]) ? ipDictionary[source] : source,
			target: ipDictionary[target] ? ipDictionary[target] : target,
			metrics: {
				danger: 116.524,
				normal: 15598
			},
			class: 'normal'
		};
	});

	return jsonData;
}

function constructVizceralFinalJSONData (nodes, connections) {
	return {
		"renderer": "global",
		"name": "edge",
		"nodes": [
			{
	      		"renderer": "region",
	      		"name": "INTERNET",
	      		"class": "normal"
	    	},
	    	{
	      		"renderer": "region",
				"name": "us-west-2",
				"maxVolume": 50000,
				"class": "normal",
				"updated": 1466838546805,
				"nodes": nodes,
				"connections": connections 
	    	}
		],
		"connections": [
	    	{
	      		"source": "INTERNET",
	      		"target": "us-west-2",
	      		"metrics": {
	        		"normal": 26037.626,
	        		"danger": 92.37
	      		},
	      		"notices": [],
	      		"class": "normal"
	    	}
	  	]
	}
}

function mapIpsToAWSInstanceName (nodes, callback) {
	const params = {
		Filters: [
			{
				Name: 'private-ip-address',
				Values: nodes
			}
		]
	};

    awsEC2.describeInstances(params , function (err, result) {
    	if (err) {
    		console.log(err);
    		process.exit(-1);
    	}

    	const instances = result.Reservations;

    	async.map(instances, function (instance, next) {
    		var mappedData = {
    			instance_id: instance.Instances[0].InstanceId,
    			name: _.findWhere(instance.Instances[0].Tags, { Key: 'Name' }).Value,
    			private_ip: instance.Instances[0].PrivateIpAddress
    		};

    		next(null, mappedData);
    	}, callback)
    });
}

parse(data, { delimiter: ' ' }, function (err, output) {
	if (err) {
		console.log(err);
		process.exit(-1);
	}

	output.shift();

	var allNodes = [];
	var allConnections = [];

	_.each(output, function (datum) {
		var sourceAddress = datum[3];
		var destinationAddress = datum[4];

		allNodes.push(datum[3]);
		allNodes.push(datum[4]);
		allConnections.push(`${datum[3]};${datum[4]}`);

		var jsonData = {
			source_address: datum[3],
			destination_address: datum[4]
		};

		return jsonData;
	})

	var allUniqueNodes = _.uniq(allNodes);
	var allUniqueConnections = _.uniq(allConnections);

	mapIpsToAWSInstanceName(allUniqueNodes, function (err, data) {
		if (err) {
			console.log(err);
			process.exit(-1);
		}

		var ipDictionary = {};

		_.each(data, function (datum) {
			ipDictionary[datum.private_ip] = datum.name
		});

		var vizceralNodes = constructVizceralNodesJSONData(allUniqueNodes, ipDictionary);
		var vizceralConnections = constructVizceralConnectionsJSONData(allUniqueConnections, ipDictionary);	
		var finalJSONData = constructVizceralFinalJSONData(vizceralNodes, vizceralConnections)

		fs.writeFileSync('result.json', JSON.stringify(finalJSONData, null, 4));

		process.exit(0);
	});
});

