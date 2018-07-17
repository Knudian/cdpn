Reveal.initialize({
    controls: true,
    controlsTutorial: false,
    progress: true,
    history: false,
    center: true,
    transition: 'slide', // none/fade/slide/convex/concave/zoom
    // More info https://github.com/hakimel/reveal.js#dependencies
    dependencies: [
        { src: 'lib/js/classList.js', condition: function() { return !document.body.classList; } },
        { src: 'plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
        { src: 'plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
        { src: 'plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
        { src: 'plugin/search/search.js', async: true },
        { src: 'plugin/zoom-js/zoom.js', async: true },
        { src: 'plugin/notes/notes.js', async: true }
    ],
    menu: {
        side: 'left',
        numbers: false,
        titleSelector: 'h1, h2, h3, h4, h5, h6',
        useTextContentForMissingTitles: false,
        hideMissingTitles: false,
        markers: false,
        custom: false,
        themes: [
            { name: 'Black', theme: 'css/theme/black.css' },
            { name: 'White', theme: 'css/theme/white.css' },
            { name: 'League', theme: 'css/theme/league.css' },
            { name: 'Sky', theme: 'css/theme/sky.css' },
            { name: 'Beige', theme: 'css/theme/beige.css' },
            { name: 'Simple', theme: 'css/theme/simple.css' },
            { name: 'Serif', theme: 'css/theme/serif.css' },
            { name: 'Blood', theme: 'css/theme/blood.css' },
            { name: 'Night', theme: 'css/theme/night.css' },
            { name: 'Moon', theme: 'css/theme/moon.css' },
            { name: 'Solarized', theme: 'css/theme/solarized.css' }
        ],
        transitions: true,
        openButton: true,
        openSlideNumber: false,
        keyboard: true,
        sticky: false,
        autoOpen: true,
        delayInit: false,
        loadIcons: true
    }
});
// Shows the slide number using default formatting
Reveal.configure({ slideNumber: true });
Reveal.configure({ slideNumber: 'c/t' });
Reveal.configure({ pdfMaxPagesPerSlide: 4 });
// Leaflet component
var nmsMap = L.map('map', { zoomControl: false}).setView([46.52863469527167,2.43896484375], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(nmsMap);

var ptAngers = L.marker([47.4207, -0.5548]).addTo(nmsMap);
var ptParis  = L.marker([48.8032, 2.3511]).addTo(nmsMap);
var ptMonaco = L.marker([43.7289, 7.4183]).addTo(nmsMap);

// Charts
var colors = [
    "#DAF7A6",
    "#FFC300",
    "#FF5733",
    "#C70039",
    "#900C3F",
    "#581845"
];

function getDataKeys() {
    var keys = Object.keys(datas.commits).sort();
    var weeks = [];
    keys.forEach(function(key) {
        var week = getWeekFromKey(key);
        if (weeks.indexOf(week) < 0) {
            weeks.push(week);
        }
    });
    return weeks;
}
function getWeekFromKey(key) {
    var parts = key.split('-'),
        year = parts[0],
        month = parts[1],
        day = parts[2];
    var d = new Date(Date.UTC(year, month, day));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return d.getUTCFullYear()+"-"+weekNo;
}
function buildWeeklyDataSet(projectIndex) {
    var weeks = getDataKeys();
    var dataset = [];
    weeks.forEach(function(week) {
        var value = 0;
        for(var commit in datas.commits) {
            if( getWeekFromKey(commit) === week) {
                value+=datas.commits[commit][projectIndex];
            }
        }
        dataset.push(value);
    });
    return dataset;
}
function buildDataSets() {
    return datas.projects.map(function(project, index) {
        return {
            label: project,
            data : buildWeeklyDataSet(index),
            backgroundColor : colors[index],
            borderColord : colors[index],
            borderWidth: 1
        };
    });
}
/* Draw the Chart */
var commitGraphCtx = document.getElementById("commitGraph").getContext('2d');
var commitGraph = new Chart(commitGraphCtx, {
    type: 'bar',
    data: {
        labels: getDataKeys(),
        datasets: buildDataSets()
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                },
                stacked: true
            }],
            xAxes: [{
                stacked: true
            }]
        }
    }
});

function getIssueDataKeys() {
    datas.trackers = datas.trackers.sort();
    return datas.trackers;
}
function getDateKeys() {
    return Object.keys(datas.commits).sort();
}
function buildIssueDataSets() {
    // Rebuild a good date list.
    var dateList = Object.keys(datas.commits);
    datas.issueList.forEach(function(issue) {
        ['created_on','closed_on'].forEach(function(field) {
            if (dateList.indexOf(issue[field]) < 0) {
                dateList.push(issue[field]);
            }
        })
    });
    dateList.sort();

    // the dateList var is now the index setter for any value.

    var dataSets = getIssueDataKeys().map(function() {
        return dateList.map(function() {
            return 0;
        });
    });

    var modif = [1, -1];
    datas.issueList.forEach(function(issue) {
        var trackerIndex = getIssueDataKeys().indexOf(issue.tracker);
        ['created_on', 'closed_on'].forEach(function(field, index) {
            var dateIdx = dateList.indexOf(issue[field]);
            if (issue[field] !== "") {
                dataSets[trackerIndex][dateIdx] += modif[index];
            }
        });
    });

    // Compiling values.
    dataSets.forEach(function(trackerValues) {
        trackerValues.forEach(function(value, index) {
            if (index > 0) {
                trackerValues[index] = trackerValues[index-1]+value;
            }
        });
    });

    return getIssueDataKeys().map(function(tracker, tIdx) {
        return {
            label : tracker,
            data : dataSets[tIdx].map(function(value, idx) {
                return { t: dateList[idx], y: value };
            }),
            backgroundColor : colors[tIdx],
            borderColord : colors[tIdx],
            borderWidth: 1,
            radius: 0
        };
    });
}
/* Draw the Chart */
var issueGraphCtx = document.getElementById("issueGraph").getContext('2d');
var issueGraph = new Chart(issueGraphCtx, {
    type: 'line',
    data: {
        labels: getDateKeys(),
        datasets: buildIssueDataSets()
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                },
                stacked: true
            }],
            xAxes: [{
                stacked: true
            }]
        }
    }
});