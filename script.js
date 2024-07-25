let currentDate = new Date("2023-09-01"); // Initial date to display

const svg = d3.select("#calendar");
const tooltip = d3.select("#tooltip");

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%B %d, %Y");
const formatMonthYear = d3.timeFormat("%B %Y");

function loadData(monthYear) {
    d3.json("./data.json").then(data => {
        data.forEach(d => {
            d.date = parseDate(d.date);
            d.sleep_duration = +d.sleep_duration;
            d.num_steps = +d.num_steps;
            d.weight = +d.weight;
        });

        updateCalendar(data, monthYear);
    }).catch(error => {
        console.error("Error loading the JSON data:", error);
    });
}

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
                    tooltip.html(`
                        <strong>Date:</strong> ${formatDate(dayData.date)}<br>
                        <strong>Sleep:</strong> ${dayData.sleep_duration} hours<br>
                        <strong>Steps:</strong> ${dayData.num_steps}<br>
                        <strong>Weight:</strong> ${dayData.weight} lbs<br>
                        <strong>Time Spent:</strong>
                        <ul>
                            <li>Class: ${dayData.timeSpent.class} min</li>
                            <li>Study: ${dayData.timeSpent.study} min</li>
                            <li>Leisure: ${dayData.timeSpent.leisure} min</li>
                            <li>Exercise: ${dayData.timeSpent.exercise} min</li>
                            <li>Reading: ${dayData.timeSpent.reading} min</li>
                            <li>Socializing: ${dayData.timeSpent.socializing} min</li>
                            <li>Eating: ${dayData.timeSpent.eating} min</li>
                        </ul>
                    `)
                    .style("left", (event.pageX + 5) + "px")
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
    loadData(currentDate);
}

document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));

// Initial load
loadData(currentDate);
