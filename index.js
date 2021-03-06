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
        where: { genre_id: film.genre_id },
        include: Genre
      }).then((films) => {
        order: [{ model: Film }, 'id'];
        let get_id = films.map((fid) => {
          return fid.id;
        });
        let film_id = get_id.toString();

        //Make 3rd party API Request
        const API_GET = {
          uri: `http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=`+film_id,
          json: true
        }
        request.get(API_GET, function(error, response, body) {
          const REVIEWS = response.body;
          //add reviews to films
          for ( let i=0; i<films.length; i++) {
            if (films[i].id == REVIEWS[i].film_id) {
              films[i].reviews = REVIEWS[i].reviews;
            }
          }
          //calculate avg rating
          const GETAVG = ((revs) => {
            let avgRev = 0;
            revs.forEach((star) => {
                avgRev += star.rating
            });
            avgRev = (avgRev/revs.length).toFixed(2);
            return avgRev;
          });
          //filter for films with less than 5 reviews
          films = films.filter(fm => (fm.reviews.length) >= 5 );

          //filter for films with average rating of 4
          films = films.filter(fm => GETAVG(fm.reviews) > 4 );

          const SEND_THIS = [];
          //Add content to SEND_THIS
          console.log(films[2]);
          films.forEach((data)=>{
            SEND_THIS.push({
              id: data.id,
              title: data.title,
              releaseDate: data.release_date,
              genre: data.genre.name,
              averageRating: GETAVG(data.reviews),
              reviews: data.reviews.length
            })
          })
          //can limit and offset results
          let limit = 10;
          let offset = 0;
          if (req.query.limit || req.query.offset) {
            if (req.query.limit) {
              limit = parseInt(req.query.limit);
            }
            if (req.query.offset) {
              offset = parseInt(req.query.offset);
            }
          }
          res.status(200).json({recommendations: SEND_THIS.slice(offset, offset+limit), meta: { limit:limit, offset:offset }});
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
