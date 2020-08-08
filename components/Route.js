class Route {
	constructor(newOrigin, newDestination) {
		this.origin = {
			name: newOrigin.name,
			coordinates: newOrigin.coordinates
		};
		this.destination = {
			name: newDestination.name,
			coordinates: newDestination.coordinates
		};
	}
	getOrigin() {
		return this.origin;
	}
	getDestination() {
		return this.destination;
	}
}

module.exports = Route;
