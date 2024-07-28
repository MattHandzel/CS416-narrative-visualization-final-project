const currentDate = new Date("2023-08-01");
let allData = []; 

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

function updateCalendar(monthYear) {
    const grid = d3.select("#grid");
    const calendar = d3.select("#calendar");
    const monthYearName = d3.select("#monthYearName");
    grid.selectAll("*").remove();

    const monthName = formatMonthYear(monthYear);
    const monthDays = d3.timeDays(d3.timeMonth(monthYear), d3.timeMonth.offset(monthYear, 1));
    monthDays.pop();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthStartDay = monthDays[0].getDay();

    monthYearName.text(monthName);

    dayNames.forEach(day => {
        grid.append("div")
            .attr("class", "header")
            .attr("colspan", 7)
            .text(day);
    });

    for (let i = 0; i < monthStartDay; i++) {
        grid.append("div")
            .attr("class", "day empty");
    }

    monthDays.forEach(date => {
        const dayData = allData.find(d => d3.timeDay(d.date).getTime() === date.getTime());

        const dayCell = grid.append("div")
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

        if (dayData && dayData.events && dayData.events.length) {
            dayCell.style("background-color", "lightcoral");
        }
    });
}

function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    const filteredData = allData.filter(d => d.date.getMonth() === currentDate.getMonth() && d.date.getFullYear() === currentDate.getFullYear());
    updateCalendar(currentDate);
}

document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));

data_path = "./data.csv";
d3.csv(data_path).then(data => {
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.sleep_duration = +d.sleep_duration;
        d.num_steps = +d.num_steps;
        d.weight = +d.weight;
        d.heart_rate_pie_chart = {
            high: +d.stress_max,
            low: +d.stress_min,
        };
        d.timeSpent = {
            homework: +d.HOMEWORK,
            exercising: +d.EXERCISING,
            school: +d.SCHOOL,
            girlfriend: +d.GIRLFRIEND,
            productivity: +d.PRODUCTIVITY,
            selfImprovement: +d['SELF IMPROVEMENT'],
            career: +d.CAREER,
            chores: +d.CHORES,
            studentOrganizations: +d['STUDENT ORGANIZATIONS'],
            personalProjects: +d['PERSONAL PROJECTS'],
            freeTime: +d['FREE TIME'],
            eating: +d.EATING,
            socializing: +d.SOCIALIZING,
            research: +d.RESEARCH,
        };
    });

    allData = data;
    updateCalendar(currentDate);
}).catch(error => {
    console.error("Error loading the CSV data:", error);
});

console.log(allData);
