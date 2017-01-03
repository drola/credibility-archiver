//TODO: Load sites from json
//TODO: Add code to hide cookie warnings

var path = require('path');
var fs = require('fs');
var async = require('async');
var childProcess = require('child_process');
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;
var handlebars = require('handlebars');
var date = new Date();
var pad2digits = function(n) {
	if (n >= 10) {
		return "" + n;
	} else {
		return "0" + n;
	}
};

var timestampSlug = date.getUTCFullYear() + '-' + pad2digits(date.getUTCMonth() + 1) + '-' + pad2digits(date.getUTCDate()) + '-' +  pad2digits(date.getUTCHours()) + pad2digits(date.getUTCMinutes());

var outdir = path.join(__dirname, 'data');

var renderSite = function(siteInfo, callback) {
	console.log("Rendering " + siteInfo.url);
	var slug = siteInfo.slug;
	var url = siteInfo.url;
	var outputDir = path.join(outdir, 'screenshots', slug);

	if(!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}

	var outFilename = path.join(outputDir, timestampSlug + ".png");


	var childArgs = [
	  path.join(__dirname, 'rasterize.js'),
	  url,
	  outFilename,
	  "1280px"
	];

	childProcess.execFile(binPath, childArgs, callback);
};

var sites = [
	{
		"slug": "delo",
		"url": "http://www.delo.si",
		"title": "Delo"
	}
]; 

var scrapeSites = function(cb) { async.eachLimit(sites, 3, renderSite, cb) };
var renderTemplates = function(cb) {
	//Load list of all screenshots that we have
	var files = {};
	sites.forEach(function(siteInfo) {
		var screenshotsDir = path.join(outdir, siteInfo.slug);
		var filesInDir = fs.readdirSync(screenshotsDir);
		files[siteInfo.slug] = filesInDir.map(function(filename) {
			var res = filename.match(/^((\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2}))\.png/g);
			if(res !== null) {
				return {
					timestamp: res[1],
					year: res[2],
					month: res[3],
					day: res[4],
					hour: res[5],
					minutes: res[6],
					filename: filename,
					filepath: path.join(screenshotsDir, filename),
					siteInfo: siteInfo
				};
			} else {
				return null;
			}
		}).filter(function(v) { return v !== null; });
	});

	//Render
	var templateFolder = path.join(__dirname, 'gallery-template');
	var tplScreenshot = handlebars.compile(fs.readFileSync(path.join(templateFolder, "screenshot.html")));
	var tplIndex = handlebars.compile(fs.readFileSync(path.join(templateFolder, "index.html")));
	var tplHeader = handlebars.compile(fs.readFileSync(path.join(templateFolder, "head.html")));
	var tplFooter = handlebars.compile(fs.readFileSync(path.join(templateFolder, "footer.html")));
	var tplArchive = handlebars.compile(fs.readFileSync(path.join(templateFolder, "archive.html")));
	var tplTimestamp = handlebars.compile(fs.readFileSync(path.join(templateFolder, "archive-timestamp.html")));

	handlebars.registerPartial('header', tplHeader());
	handlebars.registerPartial('footer', tplFooter());


	//Render HTML files with individual screenshots
	for(var siteSlug in files) {
		var latestIndex = null;
		files[siteSlug].forEach(function(screenshotInfo, idx) {
			//TODO: Don't rerender if already exists
			var fpe = screenshotInfo.split('.');
			fpe[fpe.length - 1] = 'html';
			var screenshotInfoPage = fpe.join('.');

			fs.writeFileSync(screenshotInfoPage, tplScreenshot({screenshotInfo: screenshotInfo}));

			if(latestIndex === null
				|| screenshotInfo.localeCompare(files[siteSlug][latestIndex].timestamp) > 0) {
				latestIndex = idx;
			}
		});


	}

	var filesGroupedByTimestamp = {};
	for(var siteSlug in files) {
		var latestIndex = null;
		files[siteSlug].forEach(function(screenshotInfo, idx) {
			filesGroupedByTimestamp[screenshotInfo.timestamp][siteSlug] = screenshotInfo;
		});
	}

	//Make archive pages
	var timestampsSorted = Object.keys(filesGroupedByTimestamp).sort();
	timestampsSorted.forEach(function(timestamp) {
		var outputFilename = path.join(outdir, 'archive-' + timestamp + '.html');
		fs.writeFileSync(outFilename, tplTimestamp({
			files: files,
			timestamp: timestamp
		}));
	});

	//Make archive index
	var archivePath = path.join(outdir, 'archive.html');
	fs.writeFileSync(archivePath, tplArchive({
		timestamps: timestamps.slice(0).reverse()
	}));

	//Make front page
	var lastTimestamp = timestampsSorted[timestampsSorted.length - 1];
	var latestScreenshots = filesGroupedByTimestamp[lastTimestamp];
	var indexPath = path.join(outdir, 'index.html');
	fs.writeFileSync(indexPath, tplIndex({
		files: latestScreenshots,
		timestamp: lastTimestamp
	}));


};

async.series([
	scrapeSites
]);
