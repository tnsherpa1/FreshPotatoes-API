const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;
// Establish connection
const sequelize = new Sequelize('database', '', '', {
  host: 'localhost',
  dialect: 'sqlite',
  define: {
    timestamps: false //Fixes 'cannot get created at column error'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // SQLite only
  storage: DB_PATH
});
//Check connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  // Define schema for models
  //Film schema
  const Film = sequelize.define('films', {
  title: {
    type: Sequelize.STRING
  },
  release_date: {
    type: Sequelize.STRING
  },
  tagline: {
    type: Sequelize.STRING
  },
  revenue: {
    type: Sequelize.INTEGER
  },
  budget: {
    type: Sequelize.INTEGER
  },
  runtime: {
    type: Sequelize.INTEGER
  },
  original_language: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.STRING
  },
  genre_id: {
    type: Sequelize.STRING
  }
});
//Artist schema
const Artist = sequelize.define('artists', {
  name: {
    type: Sequelize.STRING
  },
  birthday: {
    type: Sequelize.STRING
  },
  deathday: {
    type: Sequelize.STRING
  },
  gender: {
      type: Sequelize.INTEGER
  },
  place_of_birth: {
    type: Sequelize.STRING
  }
});
  //Genre schema
  const Genre = sequelize.define('genres', {
    name: {
      type: Sequelize.STRING
    }
  }
);

  //Check by get
  app.get('/', function(req,res) {
    Film.findAll({}).then((results) => {
      res.json(results.length);
    });
  });





// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  res.status(500).send('Not Implemented');
}

module.exports = app;
