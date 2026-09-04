const {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const TABLE_NAME = process.env.TASKS_TABLE;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

function generateId() {
  return `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function listTasks() {
  try {
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const data = await client.send(command);
    const items = (data.Items || []).map((item) => unmarshall(item));

    return jsonResponse(200, { items });
  } catch (error) {
    console.error('listTasks error:', error);
    return jsonResponse(500, { message: 'Could not fetch tasks', error: error.message });
  }
}

async function createTask(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const title = body.title || 'Untitled task';
    const description = body.description || '';
    const task = {
      id: generateId(),
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(task),
    });

    await client.send(command);

    return jsonResponse(201, { message: 'Task created successfully', task });
  } catch (error) {
    console.error('createTask error:', error);
    return jsonResponse(500, { message: 'Could not create task', error: error.message });
  }
}

async function getTask(event) {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return jsonResponse(400, { message: 'Task ID is required' });
    }

    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id }),
    });

    const data = await client.send(command);
    if (!data.Item) {
      return jsonResponse(404, { message: 'Task not found' });
    }

    return jsonResponse(200, { task: unmarshall(data.Item) });
  } catch (error) {
    console.error('getTask error:', error);
    return jsonResponse(500, { message: 'Could not fetch task', error: error.message });
  }
}

async function updateTask(event) {
  try {
    const id = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : {};

    if (!id) {
      return jsonResponse(400, { message: 'Task ID is required' });
    }

    const existing = await getTask({ pathParameters: { id } });
    const currentTask = existing.statusCode === 200 ? JSON.parse(existing.body).task : null;

    if (!currentTask) {
      return jsonResponse(404, { message: 'Task not found' });
    }

    const updatedTask = {
      ...currentTask,
      title: body.title || currentTask.title,
      description: body.description ?? currentTask.description,
      completed: body.completed ?? currentTask.completed,
      updatedAt: new Date().toISOString(),
    };

    const command = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id }),
      UpdateExpression: 'SET title = :title, description = :description, completed = :completed, updatedAt = :updatedAt',
      ExpressionAttributeValues: marshall({
        ':title': updatedTask.title,
        ':description': updatedTask.description,
        ':completed': updatedTask.completed,
        ':updatedAt': updatedTask.updatedAt,
      }),
      ReturnValues: 'ALL_NEW',
    });

    const data = await client.send(command);
    return jsonResponse(200, { message: 'Task updated successfully', task: unmarshall(data.Attributes) });
  } catch (error) {
    console.error('updateTask error:', error);
    return jsonResponse(500, { message: 'Could not update task', error: error.message });
  }
}

async function deleteTask(event) {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return jsonResponse(400, { message: 'Task ID is required' });
    }

    const command = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id }),
    });

    await client.send(command);

    return jsonResponse(200, { message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('deleteTask error:', error);
    return jsonResponse(500, { message: 'Could not delete task', error: error.message });
  }
}

async function health() {
  return jsonResponse(200, {
    service: 'aws-serverless-task-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  health,
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
};
