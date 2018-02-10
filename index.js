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
    type: Sequelize.INTEGER
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

//Setup association
Film.belongsTo(Genre, {foreignKey: 'genre_id'});





// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);


// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  let parent_id = req.params.id;
  Film.findById(parent_id).then((film)=>{
    if (film) {
      Film.findAll({
        where: { genre_id: film.genre_id }
      }).then((films) => {
        res.json(films);

        let get_id = films.map((fid) => {
          return fid.id;
        });
        let film_id = get_id.toString();
        console.log(film_id)
        //Make 3rd party API Request
        const API_GET = {
          uri: `http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=`+film_id,
          json: true
        }
        request.get(API_GET, function(error, response, body) {
          console.log(response.body)
        })
      });


    } else {
      res.status(422).json({message: 'key missing'});
    }
  });
}

//404 HANDLER
app.use((req,res,next) => {
  res.status(404).json({message: 'key missing'});
});

module.exports = app;
