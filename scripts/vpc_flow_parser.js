var _ = require('underscore');
var fs = require('fs');
var parse = require('csv-parse');

var data = fs.readFileSync('./sample_vpc_flow.log','utf8')

parse(data, { delimiter: ' ' }, function (err, output) {
	if (err) {
		console.log(err);
		process.exit(-1);
	}

	var mappedOutput = _.map(output, function (datum) {
		console.log(datum)
		var jsonData = {
			source_address: datum[3],
			destination_address: datum[4]
		};

		return jsonData;
	})

	console.log(JSON.stringify(mappedOutput, null, 4));
	process.exit(0);
});