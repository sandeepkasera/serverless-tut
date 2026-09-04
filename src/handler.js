const express = require('express');
const serverless = require('serverless-http');
const {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const app = express();
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const TABLE_NAME = process.env.TASKS_TABLE;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    service: 'aws-serverless-task-api',
    status: 'healthy',
    region: process.env.AWS_REGION || 'ap-south-1',
    timestamp: new Date().toISOString(),
  });
});

app.get('/tasks', async (req, res) => {
  try {
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const data = await client.send(command);
    const items = (data.Items || []).map((item) => unmarshall(item));
    res.json({ items });
  } catch (error) {
    console.error('listTasks error:', error);
    res.status(500).json({ message: 'Could not fetch tasks', error: error.message });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body || {};
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: title || 'Untitled task',
      description: description || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(task),
    });

    await client.send(command);
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ message: 'Could not create task', error: error.message });
  }
});

app.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id }),
    });

    const data = await client.send(command);
    if (!data.Item) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ task: unmarshall(data.Item) });
  } catch (error) {
    console.error('getTask error:', error);
    return res.status(500).json({ message: 'Could not fetch task', error: error.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await client.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({ id }),
      })
    );

    if (!existing.Item) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const currentTask = unmarshall(existing.Item);
    const updatedTask = {
      ...currentTask,
      title: req.body.title || currentTask.title,
      description: req.body.description ?? currentTask.description,
      completed: req.body.completed ?? currentTask.completed,
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
    return res.json({ message: 'Task updated successfully', task: unmarshall(data.Attributes) });
  } catch (error) {
    console.error('updateTask error:', error);
    return res.status(500).json({ message: 'Could not update task', error: error.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const command = new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id }),
    });

    await client.send(command);
    res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ message: 'Could not delete task', error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports.handler = serverless(app);
