"use strict";

// start your engines
require('./lib/app');

//-----------------------------------------------------------------------------
// Handle uncaught exceptions
//-----------------------------------------------------------------------------
process.on('uncaughtException', function (err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
  console.error(err.stack);
  
  // Exit the app on the next tick, incase others are listen to uncaughtException
  process.nextTick(function () {
       process.exit(1);
  });
});