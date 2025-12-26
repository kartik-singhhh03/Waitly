
// Lambda-compatible entry point
import serverless from 'serverless-http';
import app from './index.js';

// Export handler for AWS Lambda
export const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

