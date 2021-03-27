# NESJS EXPRESS REST API

A example of building a rest api with NestJS, Express and TypeORM

# TECH STACK

- NestJS
- Express
- TypeORM
- PostgreSQL

## SETUP

Run `npm install` to install local dependencies
Create a `.env` file and include the following environmental variables

- `APP_ACCESS_SECRET`
- `ACCESS_TOKEN_COOKIE_NAME`
- `CLIENT_ORIGIN`

For typeorm specific environmental variables [see this page](https://typeorm.io/#/using-ormconfig)

- `TYPEORM_CONNECTION`
- `TYPEORM_ENTITIES`
- `TYPEORM_LOGGING`
- `TYPEORM_MIGRATIONS`
- `TYPEORM_MIGRATIONS_DIR`
- `TYPEORM_SYNCHRONIZE` OR Run migrations on the terminal **(Recommended for Production)**
- `TYPEORM_LOGGING` **(Recommended for Development)**
- `TYPEORM_URL`

Run `npm run build` to compile TS code to JS code then `npm run start:prod`

## TESTING

Create a `.test.env` file and include the following environmental variables as mentioned as above

Run `npm run test:e2e` for e2e tests
