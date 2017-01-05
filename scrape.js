//TODO: Load sites from json
//TODO: Add code to hide cookie warnings
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var async = require('async');
var childProcess = require('child_process');
var handlebars = require('handlebars');



var slimerjsPath = '/usr/bin/slimerjs';
if(!fs.existsSync(slimerjsPath)) {
	slimerjsPath = path.join(__dirname, 'node_modules/.bin/slimerjs');
}

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

	var outFilename = path.join(outputDir, timestampSlug + ".jpg");


	var childArgs = [

	  path.join(__dirname, 'rasterize.js'),
	  url,
	  outFilename
	];


	childProcess.execFile(slimerjsPath, childArgs, callback);
};

var sites = [
	{
		"slug": "delo",
		"url": "http://www.delo.si",
		"title": "Delo"
	},
	{
		"slug": "dnevnik",
		"url": "https://www.dnevnik.si",
		"title": "Dnevnik"
	},
	{
		"slug": "slovenskenovice",
		"url": "http://www.slovenskenovice.si",
		"title": "Slovenske novice"
	},
	{
		"slug": "24ur",
		"url": "http://www.24ur.com",
		"title": "24ur"
	},
	{
		"slug": "rtvslo",
		"url": "http://www.rtvslo.si",
		"title": "MMC RTV SLO"
	},
	{
		"slug": "vecer",
		"url": "http://www.vecer.si",
		"title": "Večer"
	},
	{
		"slug": "zurnal24",
		"url": "http://www.zurnal24.si/",
		"title": "zurnal24"
	},
	{
		"slug": "siolnet",
		"url": "http://siol.net/",
		"title": "Siol.net"
	},
	{
		"slug": "bbc",
		"url": "http://www.bbc.co.uk/",
		"title": "BBC"
	},
	{
		"slug": "newyorktimes",
		"url": "http://www.nytimes.com/",
		"title": "The New York Times"
	},
	{
		"slug": "newyorktimes",
		"url": "http://www.nytimes.com/",
		"title": "The New York Times"
	},
	{
		"slug": "foxnews",
		"url": "http://www.foxnews.com/",
		"title": "Fox News"
	},
	{
		"slug": "planet",
		"url": "http://www.planet.si/",
		"title": "Planet.si"
	},
	{
		"slug": "pozarreport",
		"url": "http://www.pozareport.si/",
		"title": "pozarreport.si"
	},
	{
		"slug": "pozarreport",
		"url": "http://www.pozareport.si/",
		"title": "pozarreport.si"
	},
	{
		"slug": "finance",
		"url": "https://www.finance.si/",
		"title": "Finance.si"
	},
	{
		"slug": "primorskenovice",
		"url": "http://www.primorske.si/",
		"title": "Primorske novice"
	},
	{
		"slug": "gorenjskiglas",
		"url": "http://www.gorenjskiglas.si/",
		"title": "Gorenjski glas"
	},
	{
		"slug": "Mladina",
		"url": "http://www.mladina.si/",
		"title": "Mladina"
	}
]; 

var scrapeSites = function(cb) {
	async.eachLimit(sites, 3, renderSite, cb);
};

var renderTemplates = function(cb) {
	//Load list of all screenshots that we have
	var files = {};
	sites.forEach(function(siteInfo) {
		var screenshotsDir = path.join(outdir, 'screenshots', siteInfo.slug);
		var filesInDir = fs.readdirSync(screenshotsDir);
		files[siteInfo.slug] = filesInDir.map(function(filename) {
			var res = filename.match(/^((\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2}))\.jpg/);
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
	handlebars.registerPartial('header', fs.readFileSync(path.join(templateFolder, "header.html"), {encoding: "utf-8"}));
	handlebars.registerPartial('footer', fs.readFileSync(path.join(templateFolder, "footer.html"), {encoding: "utf-8"}));
	var tplScreenshot = handlebars.compile(fs.readFileSync(path.join(templateFolder, "screenshot.html"), {encoding: "utf-8"}));
	var tplIndex = handlebars.compile(fs.readFileSync(path.join(templateFolder, "index.html"), {encoding: "utf-8"}));
	var tplArchive = handlebars.compile(fs.readFileSync(path.join(templateFolder, "archive.html"), {encoding: "utf-8"}));
	var tplTimestamp = handlebars.compile(fs.readFileSync(path.join(templateFolder, "archive-timestamp.html"), {encoding: "utf-8"}));



	//Render HTML files with individual screenshots
	for(var siteSlug in files) {
		files[siteSlug].forEach(function(screenshotInfo) {
			//TODO: Don't rerender if already exists
			var fpe = screenshotInfo.filepath.split('.');
			fpe[fpe.length - 1] = 'html';
			var screenshotInfoPage = fpe.join('.');

			fs.writeFileSync(screenshotInfoPage, tplScreenshot({screenshotInfo: screenshotInfo}));
		});
	}

	var filesGroupedByTimestamp = {};
	for(var siteSlug in files) {
		files[siteSlug].forEach(function(screenshotInfo) {
			if(filesGroupedByTimestamp[screenshotInfo.timestamp] === undefined) {
				filesGroupedByTimestamp[screenshotInfo.timestamp] = {};
			}

			filesGroupedByTimestamp[screenshotInfo.timestamp][siteSlug] = screenshotInfo;
		});
	}

	//Make archive pages
	var timestampsSorted = Object.keys(filesGroupedByTimestamp).sort();
	timestampsSorted.forEach(function(timestamp) {
		var outputFilename = path.join(outdir, 'archive-' + timestamp + '.html');
		fs.writeFileSync(outputFilename, tplTimestamp({
			files: filesGroupedByTimestamp[timestamp],
			timestamp: timestamp
		}));
	});

	//Make archive index
	var archivePath = path.join(outdir, 'archive.html');
	fs.writeFileSync(archivePath, tplArchive({
		timestamps: timestampsSorted.slice(0).reverse()
	}));

	//Make front page
	var lastTimestamp = timestampsSorted[timestampsSorted.length - 1];
	var latestScreenshots = filesGroupedByTimestamp[lastTimestamp];
	var indexPath = path.join(outdir, 'index.html');
	fs.writeFileSync(indexPath, tplIndex({
		files: latestScreenshots,
		timestamp: lastTimestamp
	}));

	cb();


};

async.series([
	//scrapeSites,
	renderTemplates
]);
