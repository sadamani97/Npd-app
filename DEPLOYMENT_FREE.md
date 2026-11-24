# Free deployment guide

## Current database setup

The application continues using MySQL/Sequelize. It is configured for TiDB Cloud Serverless.

Verified configuration:

- Host: `gateway01.ap-northeast-1.prod.aws.tidbcloud.com`
- Port: `4000`
- Database: `NPD-Db`
- TLS: enabled
- Local verification: passed

The database and Sequelize tables have been created successfully.

## Backend deployment

Deploy the `backend` directory to Render.

Required environment variables:

- `DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com`
- `DB_PORT=4000`
- `DB_NAME=NPD-Db`
- `DB_USER=<the TiDB user>`
- `DB_PASSWORD=<the TiDB password>`
- `DB_SSL=true`
- `JWT_SECRET=<a long random secret>`
- `CLIENT_ORIGIN=<the Vercel frontend URL>`

Do not place credentials in source files or public configuration.

## Database initialization

After deploying the backend, use one of these options:

- Set the start command to `npm start`; the server will authenticate and synchronize tables.
- For a separate initialization job, run `npm run create-tidb-database` first, then `npm run test-tidb`.

## Frontend deployment

Deploy the `frontend` directory to Vercel with:

- `REACT_APP_API_URL=https://<render-service>.onrender.com/api`

Update the backend `CLIENT_ORIGIN` to the exact Vercel URL after deployment.

## Security

Rotate the TiDB password if this credential has been shared outside TiDB or committed to Git.
