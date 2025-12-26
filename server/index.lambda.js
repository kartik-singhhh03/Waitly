// Lambda-compatible entry point
const serverless = require('serverless-http');
const app = require('./index');

// Export handler for AWS Lambda
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

