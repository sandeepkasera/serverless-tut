# AWS Serverless Task API (Node.js + Lambda)

This project is a simple backend API built with Node.js, Serverless Framework, and AWS Lambda.
It exposes REST endpoints for managing tasks and stores the data in DynamoDB.

It is designed as a beginner-friendly sample app that you can push to GitHub and deploy into your own AWS account.

## What this app does

The API supports:

- `GET /health` – check if the service is running
- `GET /tasks` – list all tasks
- `POST /tasks` – create a task
- `GET /tasks/{id}` – get one task
- `PUT /tasks/{id}` – update a task
- `DELETE /tasks/{id}` – delete a task

The app uses:

- AWS Lambda for the backend logic
- API Gateway for HTTP routes
- DynamoDB for persistent storage
- Serverless Framework to package and deploy infrastructure

## Project structure

```bash
.
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   └── handler.js
├── .gitignore
├── package.json
├── README.md
├── serverless.yml
└── node_modules/   # created after npm install
```

## Prerequisites

Before deploying, install these tools:

1. Node.js 20+
   - Download: https://nodejs.org/
2. npm
   - Comes with Node.js
3. AWS CLI
   - Download: https://aws.amazon.com/cli/
4. Serverless Framework
   - Installed automatically via `npx serverless`, but you can also install globally if you want:
   ```bash
   npm install -g serverless
   ```
5. Git
   - Download: https://git-scm.com/

## Install and run locally

From the project folder:

```bash
npm install
npx serverless offline --stage dev --httpPort 3000
```

Then open:

- http://localhost:3000/dev/health

Example request:

```bash
curl http://localhost:3000/dev/health
```

Expected output:

```json
{
  "service": "aws-serverless-task-api",
  "status": "healthy",
  "timestamp": "..."
}
```

## How the backend works

This project creates a Lambda function for each endpoint.
The Serverless Framework reads the `serverless.yml` file and creates all required AWS resources.

### Important pieces

#### `serverless.yml`
This file tells Serverless:

- which AWS region to use
- which Node runtime to use
- what Lambda functions to create
- which HTTP routes to expose
- which DynamoDB table to create

#### `src/handler.js`
This file contains the actual lambda code.
Each exported function receives an AWS Lambda event and returns an HTTP-style response.

#### DynamoDB
The app stores tasks in a table called:

```bash
aws-serverless-task-api-dev-tasks
```

This table is automatically created by CloudFormation when you deploy.

## Push to GitHub

1. Create a new GitHub repo in your browser.
2. From your terminal:

```bash
git init
git add .
git commit -m "Initial serverless app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace:

- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repo name

## AWS setup for your own account

This is the most important part for a beginner.

### 1) Create an AWS account

If you do not already have one:

- Go to: https://aws.amazon.com/
- Sign up for a free account
- Add a payment method
- Verify identity if needed

Important:

- AWS free tier is available for many services
- This sample app is very small and often stays within free-tier limits
- But always watch your billing dashboard if you are learning

### 2) Create an IAM user for this project

Never use your root AWS account for daily development.
The safest practice is to create an IAM user.

In AWS Console:

1. Open IAM
2. Click Users
3. Click Create user
4. Name it something like `serverless-demo-user`
5. Enable Access key - Programmatic access
6. Attach a policy with enough permissions for deployment

A simple policy for learning is:

- AWSLambdaFullAccess
- AmazonAPIGatewayAdministrator
- AmazonDynamoDBFullAccess
- IAMFullAccess
- CloudFormationFullAccess
- AmazonS3FullAccess
- AdministratorAccess (only for learning; not ideal for production)

For a real project, you would limit permissions, but for learning, the admin-level approach is easiest.

### 3) Create AWS access keys

After creating the IAM user:

1. Go to the user
2. Select Security credentials
3. Click Create access key
4. Download the CSV or copy the values

You will get:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### 4) Install and configure AWS CLI

Run:

```bash
aws configure
```

Then enter:

- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

You can also verify with:

```bash
aws sts get-caller-identity
```

If it works, your CLI is connected to your AWS account.

### 5) Set your AWS region

This project currently uses:

```yaml
region: us-east-1
```

You can keep that unless you want a different AWS region.
If you want another region, update `serverless.yml`:

```yaml
provider:
  region: ap-south-1
```

### 6) Deploy the app

From the project folder:

```bash
npx serverless deploy --stage prod
```

This will:

- create the Lambda functions
- create the API Gateway endpoints
- create the DynamoDB table
- deploy the code

The output will include the API endpoint URL.
It usually looks like:

```bash
https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

### 7) Test the deployed app

Try:

```bash
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/health
```

Create a task:

```bash
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn AWS","description":"Finish the serverless tutorial"}'
```

List tasks:

```bash
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/tasks
```

## GitHub Actions deployment (recommended)

This repo already includes a deployment workflow at:

```bash
.github/workflows/deploy.yml
```

It automatically deploys when code is pushed to the `main` branch.

### Add GitHub secrets

In your GitHub repo:

1. Go to Settings
2. Open Secrets and variables
3. Select Actions
4. Add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

Then push code to GitHub:

```bash
git add .
git commit -m "Add serverless deployment workflow"
git push origin main
```

GitHub Actions will deploy your app using those AWS credentials.

## Cost basics

This sample app is small, but you are still using AWS services.
The biggest costs are usually:

- Lambda invocations
- API Gateway requests
- DynamoDB storage and reads/writes

For a tiny learning project, the cost is usually very low or near zero depending on usage.

## Important security warning

For learning and testing, using an IAM admin user is easy.
But in real applications, you should:

- use least-privilege IAM policies
- store secrets in GitHub Secrets or AWS Secrets Manager
- avoid committing real AWS keys into source code
- separate dev and prod accounts if possible

## What to change for your own app

If you want to adapt this project, the most common files to edit are:

- `serverless.yml` – service name, region, stage, function names
- `src/handler.js` – business logic
- `package.json` – scripts and dependencies

## Next steps

You can extend this project with:

- authentication with Cognito or Lambda authorizer
- file uploads to S3
- database tables with relationships
- front-end app served from S3 and CloudFront
- CI/CD with GitHub Actions

## Summary

This project gives you a clean, beginner-friendly AWS Lambda backend.
It uses Node.js, DynamoDB, API Gateway, and Serverless Framework.

Once you set up your AWS account and deploy it, your app will be running on AWS Lambda and accessible through an HTTP endpoint.

---

If you want, I can also make the next version of this project:

1. a better CRUD app with validation
2. a frontend React app that calls the API
3. a production-grade version with authentication and CI/CD
