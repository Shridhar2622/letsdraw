import client from 'prom-client';

// Collect default Node.js metrics (CPU, RAM, Event Loop, etc.)
client.collectDefaultMetrics();

// Custom Metrics for LetsDraw / Doodle-Dash
export const activePlayers = new client.Gauge({
    name: 'letsdraw_active_players',
    help: 'Total number of active players currently connected to the server'
});

export const activeRooms = new client.Gauge({
    name: 'letsdraw_active_rooms',
    help: 'Total number of active multiplayer game rooms'
});

export const drawEventsTotal = new client.Counter({
    name: 'letsdraw_draw_events_total',
    help: 'Total number of draw/stroke events broadcasted'
});

export const messagesSentTotal = new client.Counter({
    name: 'letsdraw_messages_sent_total',
    help: 'Total number of chat messages and guesses processed'
});

export const getMetrics = async () => {
    return await client.register.metrics();
};

export const getContentType = () => {
    return client.register.contentType;
};
