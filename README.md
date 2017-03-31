# football-shouts
## Setting up the Project

- Install yarn ```$ npm install -g yarn```

- Install the project dependencies ```$ yarn install ```

- Copy ```example-config.js``` to ```config.js``` and change the details.
- If you're marking this, a config.js file has been provided with Twitter details and MySQL details.

- Start the server ```$ yarn start```
- Lint code before pushing ```$ yarn lint```

- If you wish to turn off the console output from the SQL queries, change the logging field in dbOptions in models/Database.js from console.log to false

## If running on a DCS Machine
- nodemon may not work, in which case, using ```$ node ./bin/www``` will run the server.
- yarn may not work, in which case using ```$ npm install``` to install dependencies will work.
- warnings about jade are unimportant
- running using the nodejs command prompt is required, the normal command prompt seems to run 
a version of node which does not have es6 support, which is required for the project. 
