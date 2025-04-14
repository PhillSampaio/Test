// Constants and variables ------------
const fastify         = require('fastify')({ logger: true });
const listenMock      = require('../mock-server');
// Constants and variables ------------


// Functions --------------------------
const getEventById = (eventId) => {
    return new Promise (async (resolve, reject) => {
        try {
            const event     = await fetch('http://event.com/getEventById/' + eventId);
            const eventData = await event.json();
            resolve(eventData);
        } catch (err) {
            reject(err);
        }
    });
};
// Functions --------------------------


// Get Endpoints ----------------------
fastify.get('/getUsers', async (request, reply) => {
    const resp = await fetch('http://event.com/getUsers');
    const data = await resp.json();
    reply.send(data); 
});
fastify.get('/getEvents', async (request, reply) => {  
  const resp = await fetch('http://event.com/getEvents');
  const data = await resp.json();
  reply.send(data);
});
fastify.get('/getEventsByUserId/:id', async (request, reply) => {
  try {
    const { id }      = request.params;
    const user        = await fetch('http://event.com/getUserById/' + id);
    const userData    = await user.json();
    const userEvents  = userData.events;
    let eventArray    = [];
    
    const userEventsLgt = userEvents.length;
    const batchSize     = 10; // Ideally this value should be stored in a config file.
    let   batchStart    = 0;

    do {
      let batchEventsPromises = [];
      const limit = batchStart + batchSize;

      for (let i=batchStart; i < limit; i++) {
        batchStart += 1;
        if (!userEvents[i]) break;

        batchEventsPromises.push(getEventById(userEvents[i]));
      }

      try {
        const newEvents = await Promise.all(batchEventsPromises);
        eventArray		  = [...eventArray, ...newEvents];
      } catch (err) {
        // At least one request failed, return 500 to user.
        reply.status(500).send({'error' : 'Something went wrong, please try again later.'});
        return;
      }

    } while (batchStart < userEventsLgt);

    reply.status(200).send(eventArray);
  } catch (err) {
    // In case of a general failure
    reply.status(500).send({'error' : 'Something went wrong, please try again later.'});
  }
});
// Get Endpoints ----------------------

// Post Endpoints ---------------------
fastify.post('/addEvent', async (request, reply) => {
  try {
    const resp = await fetch('http://event.com/addEvent', {
      method: 'POST',
      body: JSON.stringify({
        id: new Date().getTime(),
        ...request.body
      })
    });
    const data = await resp.json();
    reply.send(data);
  } catch(err) {
    reply.error(err);
  }
});
// Post Endpoints ---------------------

// Start Up ---------------------------
// PORT shouldn't be hardcoded here. READ-ME
fastify.listen({ port: 3000 }, (err) => {
    listenMock();
    if (err) {
      fastify.log.error(err);
      process.exit();
    }
});
// Start Up ---------------------------
