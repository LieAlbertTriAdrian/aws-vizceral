var _ = require('underscore');
var fs = require('fs');
var parse = require('csv-parse');

var data = fs.readFileSync('./sample_vpc_flow.log','utf8')

function constructVizceralNodesJSONData (nodes) {
	var jsonData = _.map(nodes, function (node) {
		return {
			name: node,
			renderer: 'focusedChild',
			class: 'normal'
		};
	});

	return jsonData;
}

function constructVizceralConnectionsJSONData (connections) {
	var jsonData = _.map(connections, function (connection) {
		var source = connection.split('-')[0];
		var target = connection.split('-')[1];

		return {
			source: source,
			target: target,
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
		allConnections.push(`${datum[3]}-${datum[4]}`);

		var jsonData = {
			source_address: datum[3],
			destination_address: datum[4]
		};

		return jsonData;
	})

	var allUniqueNodes = _.uniq(allNodes);
	var allUniqueConnections = _.uniq(allConnections);

	var vizceralNodes = constructVizceralNodesJSONData(allUniqueNodes);
	var vizceralConnections = constructVizceralConnectionsJSONData(allUniqueConnections);	
	var finalJSONData = constructVizceralFinalJSONData(vizceralNodes, vizceralConnections)

	fs.writeFileSync('result.json', JSON.stringify(finalJSONData, null, 4));

	process.exit(0);
});

