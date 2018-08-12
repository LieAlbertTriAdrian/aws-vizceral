var _ = require('underscore');
var fs = require('fs');
var parse = require('csv-parse');

// var header = 'version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status'
// var data = '2 420361828844 eni-029ac078 172.10.255.26 172.10.0.108 56113 8080 6 7 2076 1534055315 1534055435 ACCEPT OK';

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