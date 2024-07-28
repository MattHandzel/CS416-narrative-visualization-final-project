const currentDate = new Date("2023-08-01");
let allData = [];
let eventsData = [];


print = console.log;

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

const colorPallet = ["55D6BE", "7D5BA6", "DDDDDD", "706C61", "FFBA08", "399C5", "F4A261", "2A9D8F", "E9C46A", "E76F51", "F4A261", "2A9D8F", "E9C46A", "E76F51", "F4A261", "2A9D8F", "E9C46A", "E76F51", "F4A261", "2A9D8F", "E9C46A", "E76F51", "F4A261", "2A9D8F", "E9C46A", "E76F51", "F4A261", "2A9D8F", "E9C46A", "E76F51", "F4A261", "2A9D8F", "E9C46A", "E76F51"];

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

        const _event = eventsData.find(e => parseDate(e.start_date).getTime() <= date.getTime() && date.getTime() <= parseDate(e.end_date).getTime());
        const dayCell = grid.append("div")
            .attr("class", "day")
            .text(date.getDate())
            .on("mouseover", function(event) {
                tooltip.transition().duration(200).style("opacity", .9);

                let tooltipContent = `<strong>Date:</strong> ${formatDate(date)}<br>`;

                if (dayData) {
                    tooltipContent += `
                        <strong>Sleep:</strong> ${Math.floor(dayData.sleep_duration)} hours ${Math.round(dayData.sleep_duration * 60 - Math.floor(dayData.sleep_duration) * 60)} minutes<br>
                        <strong>Steps:</strong> ${Math.round(dayData.num_steps)}<br>
                        <strong>Weight:</strong> ${Math.round(dayData.weight) == 0 ? "NaN" : Math.round(dayData.weight)} lbs<br>
                    `;

                    const heartRateData = Object.keys(dayData.heart_rate_pie_chart).map(key => {
                        return { label: key, value: Math.round(dayData.heart_rate_pie_chart[key]) };
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

                    heartRateSvgEnter.merge(heartRateSvg).selectAll("text")
                        .data(heartRateArcs)
                        .join("text")
                        .attr("transform", d => `translate(${arc.centroid(d)})`)
                        .attr("dy", "0.35em")
                        .text(d => d.data.label);

                    const timeSpentData = Object.keys(dayData.timeSpent).map(key => {
                        return { label: key, value: Math.round(dayData.timeSpent[key]) };
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
                        .attr("fill", (d, i) => "#" + colorPallet[i]);

                    timeSpentSvgEnter.merge(timeSpentSvg).selectAll("text")
                        .data(timeSpentArcs)
                        .join("text")
                        .attr("transform", d => `translate(${arc.centroid(d)})`)
                        .attr("dy", "0.35em")
                        .text(d => {
                            const total = d3.sum(timeSpentArcs.map(d => d.value));
                            const percentage = (d.value / total) * 100;
                            return percentage > 10 ? d.data.label : '';
                        });
                }

                if (_event) {
                    tooltipContent += `
                        <strong>Event:</strong> ${_event.name}<br>
                        <strong>Description:</strong> ${_event.description}
                    `;
                }

                tooltipText.html(tooltipContent);
                tooltip.style("left", (event.pageX + 5) + "px").style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        if(!dayData) {
          dayCell.style("background-color", "#FC6471");
        }
      else if(dayData && _event){
        if(_event.color.length < 5){

          dayCell.style("background-color", "#" + colorPallet[_event.color])
          
        }
        else{
          dayCell.style("background-color", _event.color);
        }

        } 
      else{
          // if there is data
        dayCell.style("background-color", "#BCECB9");
      }
    });
}

function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    const filteredData = allData.filter(d => d.date.getMonth() === currentDate.getMonth() && d.date.getFullYear() === currentDate.getFullYear());
    updateCalendar(currentDate);
}

// Allows the user to change the parameters
document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));

const data_path = "./data.csv";
d3.csv(data_path).then(data => {
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.sleep_duration = (+d.sleep_duration);
        d.num_steps = Math.round(+d.num_steps);
        d.weight = Math.round(+d.weight * 10) / 10;
        d.heart_rate_pie_chart = {
            high: Math.round(+d.stress_max),
            low: Math.round(+d.stress_min),
        };

        d.timeSpent = {
            homework: (+d.HOMEWORK),
            exercising: (+d.EXERCISING),
            school: (+d.SCHOOL),
            dating: (+d.GIRLFRIEND),
            productivity: (+d.PRODUCTIVITY),
            selfImprovement: (+d['SELF IMPROVEMENT']),
            career: (+d.CAREER),
            chores: (+d.CHORES),
            studentOrganizations: (+d['STUDENT ORGANIZATIONS']),
            personalProjects: (+d['PERSONAL PROJECTS']),
            freeTime: (+d['FREE TIME']),
            eating: (+d.EATING),
            socializing: (+d.SOCIALIZING),
            research: (+d.RESEARCH),
        };

        // get the time spent sleeping, and sum up all of the amount of hours we have 
        total_time = 0;
        Object.keys(d.timeSpent).forEach(key => {
            total_time += d.timeSpent[key];
        });
        total_time += d.sleep_duration;
        d.timeSpent.sleep = d.sleep_duration;
        d.timeSpent.unknown = 24 - total_time;
    
    });

    allData = data;
    updateCalendar(currentDate);
}).catch(error => {
    console.error("Error loading the CSV data:", error);
});

changeMonth(1);
changeMonth(1);
changeMonth(1);
changeMonth(-1);
changeMonth(-1);
changeMonth(-1);
// Load the events data
d3.json("events.json").then(data => {
    eventsData = Object.keys(data).map(key => ({
        name: key,
        description: data[key].description,
        start_date: data[key].start_date,
        end_date: data[key].end_date,
        color: data[key].color
    }));
}).catch(error => {
    console.error("Error loading the events JSON data:", error);
});
