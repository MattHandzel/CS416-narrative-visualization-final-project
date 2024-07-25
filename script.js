let currentDate = new Date("2023-09-01"); // Initial date to display
let allData = []; // To store all data after initial load

const svg = d3.select("#calendar");
const tooltip = d3.select("#tooltip");
const tooltipText = d3.select("#tooltip-text");
const heartRatePieChart = d3.select("#heart-rate-pie-chart");
const timeSpentPieChart = d3.select("#time-spent-pie-chart");

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%B %d, %Y");
const formatMonthYear = d3.timeFormat("%B %Y");

const pie = d3.pie().value(d => d.value);
const arc = d3.arc().innerRadius(0).outerRadius(50);

d3.json("./data.json").then(data => {
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.sleep_duration = +d.sleep_duration;
        d.num_steps = +d.num_steps;
        d.weight = +d.weight;
    });

    allData = data; // Store all data
    updateCalendar(data, currentDate);
}).catch(error => {
    console.error("Error loading the JSON data:", error);
});

function updateCalendar(data, monthYear) {
    const calendar = d3.select("#calendar");
    calendar.selectAll("*").remove(); // Clear existing calendar

    const monthName = formatMonthYear(monthYear);
    const monthDays = d3.timeDays(d3.timeMonth(monthYear), d3.timeMonth.offset(monthYear, 1));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthStartDay = monthDays[0].getDay();

    calendar.append("div")
        .attr("class", "header")
        .attr("colspan", 7)
        .text(monthName);

    dayNames.forEach(day => {
        calendar.append("div")
            .attr("class", "header")
            .text(day);
    });

    for (let i = 0; i < monthStartDay; i++) {
        calendar.append("div")
            .attr("class", "day empty");
    }

    monthDays.forEach(date => {
        const dayData = data.find(d => d3.timeDay(d.date).getTime() === date.getTime());

        const dayCell = calendar.append("div")
            .attr("class", "day")
            .text(date.getDate())
            .on("mouseover", function(event) {
                if (dayData) {
                    tooltip.transition().duration(200).style("opacity", .9);

                    // Update text
                    tooltipText.html(`
                        <strong>Date:</strong> ${formatDate(dayData.date)}<br>
                        <strong>Sleep:</strong> ${dayData.sleep_duration} hours<br>
                        <strong>Steps:</strong> ${dayData.num_steps}<br>
                        <strong>Weight:</strong> ${dayData.weight} lbs<br>
                    `);

                    // Update heart rate pie chart
                    const heartRateData = Object.keys(dayData.heart_rate_pie_chart).map(key => {
                        return { label: key, value: dayData.heart_rate_pie_chart[key] };
                    });

                    const heartRateArcs = pie(heartRateData);
                    const heartRateSvg = heartRatePieChart.selectAll("svg").data([null]);

                    const heartRateSvgEnter = heartRateSvg.enter().append("svg")
                        .attr("width", 100)
                        .attr("height", 100)
                        .append("g")
                        .attr("transform", "translate(50,50)");

                    heartRateSvgEnter.merge(heartRateSvg).selectAll("path")
                        .data(heartRateArcs)
                        .join("path")
                        .attr("d", arc)
                        .attr("fill", (d, i) => d3.schemeCategory10[i]);

                    // Update time spent pie chart
                    const timeSpentData = Object.keys(dayData.timeSpent).map(key => {
                        return { label: key, value: dayData.timeSpent[key] };
                    });

                    const timeSpentArcs = pie(timeSpentData);
                    const timeSpentSvg = timeSpentPieChart.selectAll("svg").data([null]);

                    const timeSpentSvgEnter = timeSpentSvg.enter().append("svg")
                        .attr("width", 100)
                        .attr("height", 100)
                        .append("g")
                        .attr("transform", "translate(50,50)");

                    timeSpentSvgEnter.merge(timeSpentSvg).selectAll("path")
                        .data(timeSpentArcs)
                        .join("path")
                        .attr("d", arc)
                        .attr("fill", (d, i) => d3.schemeCategory10[i]);

                    tooltip.style("left", (event.pageX + 5) + "px")
                           .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        if (dayData && dayData.events.length) {
            dayCell.style("background-color", "lightcoral");
        }
    });
}

function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    const filteredData = allData.filter(d => d.date.getMonth() === currentDate.getMonth() && d.date.getFullYear() === currentDate.getFullYear());
    updateCalendar(filteredData, currentDate);
}

document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));

// Initial load
d3.json("./data.json").then(data => {
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.sleep_duration = +d.sleep_duration;
        d.num_steps = +d.num_steps;
        d.weight = +d.weight;
    });

    allData = data; // Store all data
    updateCalendar(data, currentDate);
}).catch(error => {
    console.log("Error loading the JSON data:", error);
});

allData = [
    {
        "date": "2023-08-01",
        "sleep_duration": 7,
        "num_steps": 5000,
        "heart_rate_pie_chart": {
            "50-59": 0.05,
            "60-69": 0.1,
            "70-79": 0.1,
            "80-89": 0.1,
            "90-99": 0.2,
            "100-109": 0.2,
            "110-119": 0.2,
            "120-129": 0.05
        },
        "weight": 150,
        "timeSpent": {
            "class": 200,
            "study": 300,
            "leisure": 180,
            "exercise": 65,
            "reading": 20,
            "socializing": 60,
            "eating": 120
        },
        "events": ["home"]
    },
    {
        "date": "2023-08-02",
        "sleep_duration": 6.5,
        "num_steps": 6000,
        "heart_rate_pie_chart": {
            "50-59": 0.04,
            "60-69": 0.12,
            "70-79": 0.13,
            "80-89": 0.12,
            "90-99": 0.18,
            "100-109": 0.18,
            "110-119": 0.2,
            "120-129": 0.03
        },
        "weight": 151,
        "timeSpent": {
            "class": 220,
            "study": 280,
            "leisure": 190,
            "exercise": 70,
            "reading": 30,
            "socializing": 50,
            "eating": 110
        },
        "events": ["home"]
    },
    {
        "date": "2023-08-03",
        "sleep_duration": 8,
        "num_steps": 4500,
        "heart_rate_pie_chart": {
            "50-59": 0.06,
            "60-69": 0.11,
            "70-79": 0.09,
            "80-89": 0.1,
            "90-99": 0.21,
            "100-109": 0.18,
            "110-119": 0.19,
            "120-129": 0.06
        },
        "weight": 152,
        "timeSpent": {
            "class": 210,
            "study": 310,
            "leisure": 200,
            "exercise": 60,
            "reading": 25,
            "socializing": 70,
            "eating": 130
        },
        "events": ["mid-term season"]
    },
    {
        "date": "2023-08-04",
        "sleep_duration": 5.5,
        "num_steps": 7000,
        "heart_rate_pie_chart": {
            "50-59": 0.03,
            "60-69": 0.15,
            "70-79": 0.1,
            "80-89": 0.1,
            "90-99": 0.19,
            "100-109": 0.2,
            "110-119": 0.18,
            "120-129": 0.05
        },
        "weight": 150,
        "timeSpent": {
            "class": 250,
            "study": 320,
            "leisure": 160,
            "exercise": 80,
            "reading": 35,
            "socializing": 40,
            "eating": 100
        },
        "events": ["mid-term season"]
    },
    {
        "date": "2023-08-05",
        "sleep_duration": 7.5,
        "num_steps": 5500,
        "heart_rate_pie_chart": {
            "50-59": 0.07,
            "60-69": 0.1,
            "70-79": 0.12,
            "80-89": 0.09,
            "90-99": 0.2,
            "100-109": 0.19,
            "110-119": 0.15,
            "120-129": 0.08
        },
        "weight": 153,
        "timeSpent": {
            "class": 230,
            "study": 290,
            "leisure": 210,
            "exercise": 75,
            "reading": 30,
            "socializing": 55,
            "eating": 125
        },
        "events": ["mid-term season", "break-up"]
    },
    {
        "date": "2023-08-04",
        "sleep_duration": 5.5,
        "num_steps": 7000,
        "heart_rate_pie_chart": {
            "50-59": 0.03,
            "60-69": 0.15,
            "70-79": 0.1,
            "80-89": 0.1,
            "90-99": 0.19,
            "100-109": 0.2,
            "110-119": 0.18,
            "120-129": 0.05
        },
        "weight": 150,
        "timeSpent": {
            "class": 250,
            "study": 320,
            "leisure": 160,
            "exercise": 80,
            "reading": 35,
            "socializing": 40,
            "eating": 100
        },
        "events": ["mid-term season", "break-up"]
    },
    {
        "date": "2023-08-05",
        "sleep_duration": 7.5,
        "num_steps": 5500,
        "heart_rate_pie_chart": {
            "50-59": 0.07,
            "60-69": 0.1,
            "70-79": 0.12,
            "80-89": 0.09,
            "90-99": 0.2,
            "100-109": 0.19,
            "110-119": 0.15,
            "120-129": 0.08
        },
        "weight": 153,
        "timeSpent": {
            "class": 230,
            "study": 290,
            "leisure": 210,
            "exercise": 75,
            "reading": 30,
            "socializing": 55,
            "eating": 125
        },
        "events": ["break-up"]
    },
    {
        "date": "2023-09-01",
        "sleep_duration": 7,
        "num_steps": 6000,
        "heart_rate_pie_chart": {
            "50-59": 0.04,
            "60-69": 0.09,
            "70-79": 0.11,
            "80-89": 0.1,
            "90-99": 0.22,
            "100-109": 0.2,
            "110-119": 0.18,
            "120-129": 0.06
        },
        "weight": 152,
        "timeSpent": {
            "class": 240,
            "study": 290,
            "leisure": 200,
            "exercise": 70,
            "reading": 25,
            "socializing": 50,
            "eating": 120
        },
        "events": ["mid-term season"]
    },
    {
        "date": "2023-09-02",
        "sleep_duration": 6.8,
        "num_steps": 6500,
        "heart_rate_pie_chart": {
            "50-59": 0.05,
            "60-69": 0.12,
            "70-79": 0.1,
            "80-89": 0.1,
            "90-99": 0.21,
            "100-109": 0.18,
            "110-119": 0.18,
            "120-129": 0.06
        },
        "weight": 151,
        "timeSpent": {
            "class": 230,
            "study": 300,
            "leisure": 190,
            "exercise": 75,
            "reading": 20,
            "socializing": 55,
            "eating": 110
        },
        "events": []
    },
    {
        "date": "2023-09-03",
        "sleep_duration": 7.5,
        "num_steps": 5000,
        "heart_rate_pie_chart": {
            "50-59": 0.04,
            "60-69": 0.1,
            "70-79": 0.12,
            "80-89": 0.09,
            "90-99": 0.2,
            "100-109": 0.2,
            "110-119": 0.18,
            "120-129": 0.07
        },
        "weight": 150,
        "timeSpent": {
            "class": 220,
            "study": 310,
            "leisure": 180,
            "exercise": 65,
            "reading": 30,
            "socializing": 60,
            "eating": 115
        },
        "events": ["home"]
    },
    {
        "date": "2023-09-04",
        "sleep_duration": 5.8,
        "num_steps": 7500,
        "heart_rate_pie_chart": {
            "50-59": 0.02,
            "60-69": 0.15,
            "70-79": 0.11,
            "80-89": 0.12,
            "90-99": 0.2,
            "100-109": 0.19,
            "110-119": 0.18,
            "120-129": 0.03
        },
        "weight": 153,
        "timeSpent": {
            "class": 250,
            "study": 280,
            "leisure": 160,
            "exercise": 80,
            "reading": 35,
            "socializing": 40,
            "eating": 125
        },
        "events": ["Hackathon"]
    },
    {
        "date": "2023-09-05",
        "sleep_duration": 6.7,
        "num_steps": 5700,
        "heart_rate_pie_chart": {
            "50-59": 0.06,
            "60-69": 0.1,
            "70-79": 0.12,
            "80-89": 0.1,
            "90-99": 0.2,
            "100-109": 0.18,
            "110-119": 0.16,
            "120-129": 0.08
        },
        "weight": 151,
        "timeSpent": {
            "class": 230,
            "study": 300,
            "leisure": 170,
            "exercise": 70,
            "reading": 20,
            "socializing": 60,
            "eating": 120
        },
        "events": ["Hackathon"]
    }
]

console.log(allData);