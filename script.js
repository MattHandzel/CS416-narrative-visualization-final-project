const state = {
    currentDate: null,
    allData: [],
    eventsData: [],
    selectedDates: [],
    isCtrlPressed: false,
    colorPallet: ["#55D6BE", "#7D5BA6", "#DDDDDD", "#706C61", "#FFBA08", "#399C5", "#F4A261", "#2A9D8F", "#E9C46A", "#E76F51"],
};

const selectors = {
    calendar: d3.select("#calendar"),
    tooltip: d3.select("#tooltip"),
    tooltipText: d3.select("#tooltip-text"),
    heartRatePieChart: d3.select("#heart-rate-pie-chart"),
    timeSpentPieChart: d3.select("#time-spent-pie-chart"),
    cardsContainer: d3.select("#cards-container"),
    monthButtons: d3.select("#monthButtons"),
    prevMonth: d3.select("#prevMonth"),
    nextMonth: d3.select("#nextMonth"),
    annotationContainer: d3.select("#annotation-container")
};

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%B %d, %Y");
const formatMonthYear = d3.timeFormat("%B %Y");

const pie = d3.pie().value(d => d.value);
const arc = d3.arc().innerRadius(0).outerRadius(50);

const loadData = (path, parser, method) => method(path).then(parser).catch(console.error);

const parseData = (data) => {
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.sleep_duration = +d.sleep_duration;
        d.num_steps = Math.round(+d.num_steps);
        d.weight = (Math.round(+d.weight * 10) / 10) === 0 ? "NaN" : Math.round(+d.weight * 10) / 10;
        d.heart_rate_pie_chart = {
            high: Math.round(+d.stress_max),
            low: Math.round(+d.stress_min),
        };
        d.timeSpent = {
            homework: +d.HOMEWORK,
            exercising: +d.EXERCISING,
            school: +d.SCHOOL,
            dating: +d.GIRLFRIEND,
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

        const total_time = Object.values(d.timeSpent).reduce((acc, val) => acc + val, d.sleep_duration);
        d.timeSpent.sleep = d.sleep_duration;
        d.timeSpent.unknown = 24 - total_time;
    });

    return data;
};

const updateCalendar = (monthYear) => {
    const grid = d3.select("#grid");
    grid.selectAll("*").remove();
    const monthYearName = d3.select("#monthYearName");

    const monthDays = d3.timeDays(d3.timeMonth(monthYear), d3.timeMonth.offset(monthYear, 1)).slice(0, -1);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthStartDay = monthDays[0].getDay();

    monthYearName.text(formatMonthYear(monthYear));

    dayNames.forEach(day => grid.append("div").attr("class", "header").text(day));

    for (let i = 0; i < monthStartDay; i++) {
        grid.append("div").attr("class", "day empty");
    }

    monthDays.forEach(date => createDayCell(grid, date));

    addAnnotations(monthYear);
};

const createDayCell = (grid, date) => {
    const dayData = state.allData.find(d => d3.timeDay(d.date).getTime() === date.getTime());
    const _event = state.eventsData.find(e => parseDate(e.start_date).getTime() <= date.getTime() && date.getTime() <= parseDate(e.end_date).getTime());

    const dayCell = grid.append("div")
        .attr("class", "day")
        .attr("data-date", date.getTime())
        .text(date.getDate())
        .on("mouseover", function (event) {
            showTooltip(event, date, dayData, _event);
        })
        .on("mouseout", () => selectors.tooltip.transition().duration(500).style("opacity", 0))
        .on("click", () => handleDayClick(date, dayData));

    dayCell.style("background-color", getDayColor(dayData, _event));
};

const getDayColor = (dayData, event) => {
    if (!dayData) return "#FC6471";
    if (dayData && event) {
      return event.color.length < 5 ? state.colorPallet[event.color % state.colorPallet.length] : event.color;
    }
    return "";
};

const showTooltip = (event, date, dayData, _event) => {
    if (!dayData) return;

    selectors.tooltip.transition().duration(100).style("opacity", 1);
    selectors.tooltipText.html(generateTooltipContent(date, dayData, _event));
    positionTooltip(event);
};

const generateTooltipContent = (date, dayData, event) => {
    const content = [
        `<strong>Date:</strong> ${formatDate(date)}<br>`,
        `<strong>Sleep:</strong> ${Math.floor(dayData.sleep_duration)} hours ${Math.round(dayData.sleep_duration * 60 - Math.floor(dayData.sleep_duration) * 60)} minutes<br>`,
        `<strong>Steps:</strong> ${Math.round(dayData.num_steps)}<br>`,
        `<strong>Weight:</strong> ${Math.round(dayData.weight) === 0 ? "NaN" : Math.round(dayData.weight * 10) / 10} lbs<br>`,
    ];

    content.push(generatePieChart(selectors.heartRatePieChart, dayData.heart_rate_pie_chart));
    content.push(generatePieChart(selectors.timeSpentPieChart, dayData.timeSpent));

    if (event) {
        content.push(
            `<strong>Event:</strong> ${event.name}<br>`,
            `<strong>Description:</strong> ${event.description}`
        );
    }

    return content.join('');
};

const generatePieChart = (svg, data) => {
    const chartData = Object.keys(data).map(key => ({ label: key, value: Math.round(data[key]) }));
    const arcs = pie(chartData);

    const chartSvg = svg.selectAll("svg").data([null]);
    const chartSvgEnter = chartSvg.enter().append("svg")
        .attr("width", 150)
        .attr("height", 150)
        .append("g")
        .attr("transform", "translate(75,75)");

    chartSvgEnter.merge(chartSvg).selectAll("path")
        .data(arcs)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d, i) => state.colorPallet[i % state.colorPallet.length]);

    chartSvgEnter.merge(chartSvg).selectAll("text")
        .data(arcs)
        .join("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .text(d => d.data.label);

    return chartSvgEnter;
};

const positionTooltip = (event) => {
    selectors.tooltip
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
};

const handleDayClick = (date, dayData) => {
    if (state.isCtrlPressed) {
        toggleDateSelection(date, dayData);
    } else if (state.selectedDates.length > 0) {
        calculateAverages();
    }
};

const toggleDateSelection = (date, dayData) => {
    if (state.selectedDates.includes(date.getTime())) {
        state.selectedDates = state.selectedDates.filter(d => d !== date.getTime());
        d3.select(`[data-date="${date.getTime()}"]`).style("background-color", dayData ? "#BCECB9" : "#FC6471");
    } else {
        state.selectedDates.push(date.getTime());
        d3.select(`[data-date="${date.getTime()}"]`).style("background-color", "#FFD700");
    }
};

const calculateAverages = () => {
    if (state.selectedDates.length === 0) {
        alert("Please select at least one date.");
        return;
    }

    const selectedData = state.selectedDates.map(date => state.allData.find(d => d.date.getTime() === date));
    const filteredData = selectedData.filter(d => d);
    const averages = calculateAverageValues(filteredData);

    const dateRange = `${formatDate(new Date(Math.min(...state.selectedDates)))} - ${formatDate(new Date(Math.max(...state.selectedDates)))}`;

    const aggregatedCard = `
        <strong>Date Range:</strong> ${dateRange}<br>
        <strong>Sleep:</strong> ${Math.floor(averages.sleep_duration)} hours ${Math.round(averages.sleep_duration * 60 - Math.floor(averages.sleep_duration) * 60)} minutes<br>
        <strong>Steps:</strong> ${Math.round(averages.num_steps)}<br>
        <strong>Weight:</strong> ${Math.round(averages.weight * 10) / 10} lbs<br>
    `;

    renderCard(aggregatedCard, averages);
    state.selectedDates.forEach(date => d3.select(`[data-date="${date}"]`).style("background-color", state.colorPallet[state.selectedDates.length % state.colorPallet.length]));
    state.selectedDates = [];
};

const calculateAverageValues = (data) => {
    const keys = ["sleep_duration", "num_steps", "weight"];
    const averages = {};

    keys.forEach(key => {
        const validValues = data.map(d => d[key]).filter(value => !isNaN(value));
        averages[key] = d3.mean(validValues);
    });

    const timeSpentKeys = Object.keys(data[0].timeSpent);
    const timeSpentAverages = {};

    timeSpentKeys.forEach(key => {
        const validValues = data.map(d => d.timeSpent[key]).filter(value => !isNaN(value));
        timeSpentAverages[key] = d3.mean(validValues);
    });

    const heartRateKeys = ["high", "low"];
    const heartRateAverages = {};
    heartRateKeys.forEach(key => {
        const validValues = data.map(d => d.heart_rate_pie_chart[key]).filter(value => !isNaN(value));
        heartRateAverages[key] = d3.mean(validValues);
    });

    return { ...averages, timeSpent: timeSpentAverages, heart_rate_pie_chart: heartRateAverages };
};

const renderCard = (cardContent, averages) => {
    const card = selectors.cardsContainer.append("div")
        .attr("class", "card")
        .style("background-color", state.colorPallet[state.selectedDates.length % state.colorPallet.length])
        .html(cardContent + '<button class="close-btn">&times;</button>');

    const heartRateChartContainer = card.append("div").attr("class", "heart-rate-pie-chart");
    generatePieChart(heartRateChartContainer, { high: averages.heart_rate_pie_chart.high, low: averages.heart_rate_pie_chart.low });

    const timeSpentChartContainer = card.append("div").attr("class", "time-spent-pie-chart");
    generatePieChart(timeSpentChartContainer, averages.timeSpent);

    card.on("click", function (event) {
        if (event.target.classList.contains('close-btn')) {
            d3.select(this).remove();
        }
    });
};

const addAnnotations = (monthYear) => {
    const monthStart = d3.timeMonth(monthYear);
    const monthEnd = d3.timeMonth.offset(monthYear, 1);

    const monthEvents = state.eventsData.filter(event => {
        const eventStart = parseDate(event.start_date);
        const eventEnd = parseDate(event.end_date);
        return (eventStart >= monthStart && eventStart < monthEnd) || (eventEnd >= monthStart && eventEnd < monthEnd) || (eventStart <= monthStart && eventEnd >= monthEnd);
    });

    const annotations = monthEvents.map(event => {
        const highlights = event.highlights.join(", ");
        return {
            note: {
                label: `Event: ${event.name}\nHighlights: ${highlights}\nDescription: ${event.description}`,
                title: formatMonthYear(monthYear)
            },
            x: 20,
            y: 20 + 80 * monthEvents.indexOf(event),
            dy: 30,
            dx: 30
        };
    });

    const makeAnnotations = d3.annotation().annotations(annotations);
    selectors.annotationContainer.selectAll("*").remove();
    selectors.annotationContainer.append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations);
};

const changeMonth = (offset) => {
    state.currentDate.setMonth(state.currentDate.getMonth() + offset);
    updateCalendar(state.currentDate);
};

const init = async () => {
    state.allData = await loadData("./data.csv", parseData, d3.csv);
    state.eventsData = await loadData("events.json", d => d, d3.json);
    state.currentDate = d3.min(state.allData, d => d.date);

    updateCalendar(state.currentDate);
    populateMonthButtons();
};

const populateMonthButtons = () => {
    const months = d3.timeMonths(d3.min(state.allData, d => d.date), d3.max(state.allData, d => d.date));
    const buttons = selectors.monthButtons.selectAll("button").data(months);

    buttons.enter().append("button")
        .text(d => formatMonthYear(d))
        .on("click", (event, d) => {
            state.currentDate.setMonth(d.getMonth());
            state.currentDate.setFullYear(d.getFullYear());
            updateCalendar(state.currentDate);
        });

    buttons.exit().remove();
};

selectors.prevMonth.on("click", () => changeMonth(-1));
selectors.nextMonth.on("click", () => changeMonth(1));
document.addEventListener("keydown", (event) => {
    if (event.key === "Control") {
        state.isCtrlPressed = true;
    }
    if (event.key === "ArrowLeft" || event.key === "h") {
        changeMonth(-1);
    }
    if (event.key === "ArrowRight" || event.key === "l") {
        changeMonth(1);
    }
});
document.addEventListener("keyup", (event) => {
    if (event.key === "Control") {
        state.isCtrlPressed = false;
        if (state.selectedDates.length > 0) {
            calculateAverages();
        }
    }
});

init();
