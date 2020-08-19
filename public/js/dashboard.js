async function fetchTotals() {
	let res = await fetch("/alldays");
	let data = await res.json();
	return await data['theTimeline'];
	
	// document.getElementById("totalCases").innerHTML = latestDay.world.active;
}
async function setTotals() {
	let totals = await fetchTotals();
	let latestDay;
	console.log(totals);
	await totals.forEach(day => {
		if (!day.isEstimation) {
			latestDay = day;
		}
	})
	console.log(latestDay)
}
setTotals();