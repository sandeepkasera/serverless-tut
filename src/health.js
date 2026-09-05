module.exports.health = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      service: 'aws-serverless-task-api',
      status: 'healthy',
      region: process.env.AWS_REGION || 'ap-south-1',
      timestamp: new Date().toISOString(),
    }),
  };
};
