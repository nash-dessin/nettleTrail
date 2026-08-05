export class TripManager {
    constructor(storageKey = 'jipangea-trip-plans') {
        this.storageKey = storageKey;
    }

    load() {
        const stored = localStorage.getItem(this.storageKey) || '[]';
        return JSON.parse(stored);
    }

    save(trip) {
        const trips = this.load();
        const updated = [...trips, trip];
        localStorage.setItem(this.storageKey, JSON.stringify(updated));
        return trip;
    }

    delete(tripId) {
        const trips = this.load();
        const updated = trips.filter((trip) => trip.id !== tripId);
        localStorage.setItem(this.storageKey, JSON.stringify(updated));
        return updated;
    }

    update(trip) {
        const trips = this.load();
        const updated = trips.map((existing) => (existing.id === trip.id ? trip : existing));
        localStorage.setItem(this.storageKey, JSON.stringify(updated));
        return trip;
    }
}
