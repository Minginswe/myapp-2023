const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");
const music_TITLE_MAX_LENGTH = 30;
const artist_NAME_MAX_LENGTH = 30;
const comment_TITLE_MAX_LENGTH = 40;
const ADMIN_USERNAME = "Jinming";
const bcrypt = require("bcryptjs");
const sqlite = require("better-sqlite3");
const SqliteStore = require("better-sqlite3-session-store")(expressSession);
const sessionDB = new sqlite("sessions.db");
const HASDED_VALUE_PASSWORD =
  "$2a$10$g7CXcZp9.bLsV.g.EnUzgOIiVVd3pJS.3gBOSAciWUP8SjkDtO96m";

// new a database name JinmignWang
const db = new sqlite3.Database("JinmingWang-database.db");

db.run(`
CREATE TABLE IF NOT EXISTS musics (
    mid INTEGER PRIMARY KEY,
    title TEXT,
    musicGenre TEXT,
    grade INTEGER
    )
`);

db.run(`
CREATE TABLE IF NOT EXISTS artists (
     aid INTEGER PRIMARY KEY,
     artistName TEXT,
     type TEXT,
     mid INTEGER,
     FOREIGN KEY (mid) REFERENCES musics (mid)
     )
`);

db.run(`
CREATE TABLE IF NOT EXISTS comments (
     cid INTEGER PRIMARY KEY,
     mid INTEGER,
     comment TEXT,
     time Text,
     FOREIGN KEY (mid) REFERENCES musics (mid)
     )
`);

db.run("PRAGMA foreign_keys = ON");


const app = express();

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.use(express.static("public"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

// The following  lines of code was  adapted from https://www.npmjs.com/package/better-sqlite3-session-store Accessed: 2023-01-12
app.use(
  expressSession({
    store: new SqliteStore({
      client: sessionDB,
      expired: {
        clear: true,
        intervalMs: 90000,
      },
    }),
    cookie: {
      maxAge: 360000,
    },
    saveUninitialized: true,
    resave: false,
    secret: "$2a$10$g7CXcZp9.bLsV.g.EnUzgOIiVVd3pJS.3gBOSAciWUP8SjkDtO96m",
  })
);
//————————————————————————————————————————————————————————————————————————
app.use(function (request, response, next) {
  response.locals.session = request.session;
  next();
});
// ———————————————————————————————————————————————————————————————————————
app.get("/", function (request, response) {
  const model = {
    isLoggedIn : request.session.isLoggedIn,
    name : request.session.name,
    isAdmin : request.session.isAdmin
  }
  response.render("start.hbs", model);
});
//get music create page
app.get("/musics/create", function (request, response) {
  response.render("create-music.hbs");
});
//get artist create page
app.get("/artists/create", function (request, response) {
  response.render("create-artists.hbs");
});

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.get('/about', function (request, response) {
  response.render('about.hbs');
})

app.get('/contact', function (request, response) {
  response.render('contact.hbs');
})

// ——————————————————————————————————————————————————————————————————————————

app.post("/login", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;
  const isMatch = bcrypt.compareSync(password, HASDED_VALUE_PASSWORD);
  if (username == ADMIN_USERNAME && isMatch) {
    request.session.isLoggedIn = true;
    request.session.name = 'Jinming';
    response.redirect("/");
  } else {
    const model = {
      failedToLogin: true,
    };
    response.render("login.hbs", model);
  }
});

// read——————————————————————————————————————————————————————————————————————————
//read    musics----
app.get("/musics", function (request, response) {
  const query = `SELECT * FROM musics`;
  db.all(query, function (error, musics) {
    const errorMessages = [];
    if (error) {
      errorMessages.push("Internal server error");
    }
    const model = {
      errorMessages,
      musics,
    };

    response.render("musics.hbs", model);
  });
});
//read musics----

//read artists----
app.get("/artists", function (request, response) {
  const query = `SELECT * FROM artists`;
  db.all(query, function (error, artists) {
    const errorMessages = [];
    if (error) {
      errorMessages.push("Internal server error");
    }
    const model = {
      errorMessages,
      artists,
    };
    response.render("artists.hbs", model);
  });
});
//read artists----

//read comments----
app.get("/comments", function (request, response) {
  const query = `SELECT * FROM comments`;
  db.all(query, function (error, comments) {
    const errorMessages = [];
    if (error) {
      errorMessages.push("Internal server error");
    }
    const model = {
      errorMessages,
      comments,
    };
    response.render("comments.hbs", model);
  });
});
//read comments----
// read——————————————————————————————————————————————————————————————————————————

// create——————————————————————————————————————————————————————————————————————————
//create music----
const maxGrade = 10;
app.post("/musics/create", function (request, response) {
  const title = request.body.title;
  const grade = parseInt(request.body.grade, 10);
  const musicGenre = request.body.genre;

  const errorMessages = [];

  if (title == "") {
    errorMessages.push("Title can't be empty");
  } else if (music_TITLE_MAX_LENGTH < title.length) {
    errorMessages.push(
      "Title may be at most " + music_TITLE_MAX_LENGTH + " characters long"
    );
  }

  if (isNaN(grade)) {
    errorMessages.push("You did not enter a number for the grade");
  } else if (grade < 0) {
    errorMessages.push("Grade may not be negative");
  } else if (maxGrade < grade) {
    errorMessages.push("Grade may at most be" + maxGrade);
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("Not logged in");
  }

  if (errorMessages.length == 0) {
    const query = `INSERT INTO musics (title,musicGenre,grade) VALUES (?,?,?)`;
    const values = [title, musicGenre, grade];
    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push("Internal server error");
        const model = {
          errorMessages,
          title,
          musicGenre,
          grade,
        };
        response.render("create-music.hbs", model);
      } else {
        response.redirect("/musics");
      }
    });
  } else {
    const model = {
      errorMessages,
      title,
      musicGenre,
      grade,
    };
    response.render("create-music.hbs", model);
  }
});
//create music----

//create artist----
app.post("/musics/:id/artists/create", function (request, response) {
  const artistName = request.body.artistName;
  const mid =  request.params.id;
  const type = request.body.artistType;
  const errorMessages = [];

  if (artistName == "") {
    errorMessages.push("Artist can't be empty");
  } else if (artist_NAME_MAX_LENGTH < artistName.length) {
    errorMessages.push(
      "Artist may be at most " + artist_NAME_MAX_LENGTH + " characters long"
    );
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("Not logged in");
  }

  if (errorMessages.length == 0) {
    const query = `INSERT INTO artists (artistName, type, mid) VALUES (?,?,?)`;
    const values = [artistName, type, mid];
    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push("Internal server error");
        const model = {
          errorMessages,
          artistName,
          type,
          mid,
        };
        response.render("create-artists.hbs", model);
      } else {
        response.redirect("/artists");
      }
    });
  } else {
    const model = {
      errorMessages,
      artistName,
      type,
      mid,
    };
    response.render("create-artists.hbs", model);
  }
});
//create artist----

//create comment----
app.post("/musics/:id/comments/create", function (request, response) {
  const comment = request.body.comment;
  const mid =  request.params.id;
  const time = request.body.time;
  const errorMessages = [];

  if (comment == "") {
    errorMessages.push("Comment can't be empty");
  } else if (comment_TITLE_MAX_LENGTH < comment.length) {
    errorMessages.push(
      "Comment may be at most " + comment_TITLE_MAX_LENGTH + " characters long"
    );
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("Not logged in");
  }

  if (errorMessages.length == 0) {
    const query = `INSERT INTO comments (mid,comment, time) VALUES (?,?,?)`;
    const values = [mid,  comment, time];
    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push("Internal server error");
        const model = {
          errorMessages,
          comment,
          mid,
        };
        response.render("create-comment.hbs", model);
      } else {
        response.redirect("/comments");
      }
    });
  } else {
    const model = {
      errorMessages,
      comment,
      mid,
    };
    response.render("create-comment.hbs", model);
  }
});
//create comment----
// create—————————————————————————————————————————————————————————————————————————

/// skip to the music
app.get("/musics/:id", function (request, response) {
  const id = request.params.id;
  const query = `SELECT * FROM musics WHERE mid = ?`;
  const values = [id];
  db.get(query, values, function (error, music) {
    if (error) {
      errorMessage.push("Failed to access database");
    }
    const model = {
      music,
    };

    response.render("music.hbs", model);
  });
});

// skip to the music——————————————————————————————————————————————————————————————————————————

// delete——————————————————————————————————————————————————————————————————————————
//delete music----
app.post("/musics/delete/:id", function (request, response) {
  const id = request.params.id;
  const errorMessages = [];
  
  if (!request.session.isLoggedIn) {
    errorMessages.push("You haven't loggedin yet");
  }

  if (errorMessages.length == 0) {
    const deleteSql = `DELETE FROM musics WHERE mid = ?`;

    db.run(deleteSql, id, function (error) {
      if (error) {
        errorMessages.push("Wrong code, maybe please delete your comments or artist about this music");
        const model = {
          errorMessages,
          id,
        };

        response.render("delete-music.hbs", model);
      } else {
        response.redirect("/musics");
      }
    });
  } else {
    const model = {
      errorMessages,
      id,
    };

    response.render("delete-music.hbs", model);
  }
});
//delete music----

//delete artist----
app.post("/artists/deleteArtist/:id", function (request, response) {
  const id = request.params.id;
  const errorMessages = [];

  if (!request.session.isLoggedIn) {
    errorMessages.push("You haven't loggedin yet");
  }

  if (errorMessages.length == 0) {
    const deleteSql = `DELETE FROM artists WHERE aid = ?`;
    db.run(deleteSql, id, function (error) {
      if (error) {
        errorMessages.push("Wrong code");
        const model = {
          errorMessages,
          id,
        };
        response.render("delete-artist.hbs", model);
      } else {
        response.redirect("/artists");
      }
    });
  } else {
    const model = {
      errorMessages,
      id,
    };

    response.render("delete-artist.hbs", model);
  }
});
//delete artist----

//delete comments----
app.post("/comments/deleteComment/:id", function (request, response) {
  const id = request.params.id;
  const errorMessages = [];

  if (!request.session.isLoggedIn) {
    errorMessages.push("You haven't loggedin yet");
  }

  if (errorMessages.length == 0) {
    const deleteSql = `DELETE FROM comments WHERE cid = ?`;

    db.run(deleteSql, id, function (error) {
      if (error) {
        errorMessages.push("Wrong code");
        const model = {
          errorMessages,
          id,
        };

        response.render("delete-comment.hbs", model);
      } else {
        response.redirect("/comments");
      }
    });
  } else {
    const model = {
      errorMessages,
      id,
    };

    response.render("delete-comment.hbs", model);
  }
});
//delete comments----

// delete——————————————————————————————————————————————————————————————————————————

// update——————————————————————————————————————————————————————————————————————————
//update music----
app.post("/musics/update/:id", function (request, response) {
  const id = request.params.id;
  const grade = parseInt(request.body.grade, 10);
  const title = request.body.title;
  const musicGenre = request.body.musicGenre;
  const errorMessages = [];

  if (isNaN(grade)) {
    errorMessages.push("You didn't enter a grade number");
  } else if (grade < 0) {
    errorMessages.push("Grade can't be negative");
  } else if (maxGrade < grade) {
    errorMessages.push("The highest grade of Grade is" + maxGrade);
  }

  if (!request.session.isLoggedIn) {
    errorMessages.push("You haven't loggedin yet");
  }

  if (errorMessages.length == 0) {
    const update_sql = `UPDATE musics SET title = ?, musicGenre =?, grade = ? WHERE mid = ?`;
    const update_info = [title, musicGenre, grade, id];

    db.run(update_sql, update_info, function (error) {
      if (error) {
        errorMessages.push("Server error, please check the code again");
        const model = {
          errorMessages,
          id,
          title,
          musicGenre,
          grade,
        };
        response.render('musics.hbs',model);
      } else {
        response.redirect("/musics");
      }
    });
  } else {
    const model = {
      errorMessages,
      id,
      title,
      musicGenre,
      grade,
    };
    response.render('musics.hbs', model);
  }
});
//update music----

//update artist----
app.post("/artists/update/:id", function (request, response) {
  const id = request.params.id;
  const artistName = request.body.artistName;
  const type = request.body.type;
  const errorMessages = [];

  if (!request.session.isLoggedIn) {
    errorMessages.push("You haven't loggedin yet");
  }

  if (errorMessages.length == 0) {
    const update_sql = `UPDATE artists SET artistName = ?, type =? WHERE aid = ?`;
    const update_info = [artistName, type, id];

    db.run(update_sql, update_info, function (error) {
      if (error) {
        errorMessages.push("Server error, please check the code again");
        const model = {
          errorMessages,
          id,
          artistName,
          type,
        };
        response.render('artists.hbs', model);
      } else {
        response.redirect("/artists");
      }
    });
  } else {
    const model = {
      errorMessages,
      artistName,
      type,
    };
    response.render('artists.hbs', model);
  }
});

//update artist----

//update commnet----
app.post("/comments/update/:id", function (request, response) {
  const id = request.params.id;
  const comment = request.body.comment;
  const errorMessages = [];

  if (!request.session.isLoggedIn) {
    errorMessages.push("You haven't loggedin yet");
  }

  if (errorMessages.length == 0) {
    const update_sql = `UPDATE comments SET comment = ? WHERE cid = ?`;
    const update_info = [comment, id];

    db.run(update_sql, update_info, function (error) {
      if (error) {
        errorMessages.push("Server error, please check the code again");
        const model = {
          errorMessages,
          id,
          comment,
        };
        response.render('comments.hbs', model);
      } else {
        response.redirect("/comments");
      }
    });
  } else {
    const model = {
      errorMessages,
      comment,
    };
    response.render('comments.hbs', model);
  }
});
//update commnet----
// update——————————————————————————————————————————————————————————————————————————

//LogOut ——————————————————————————————————————————————————————————————————————————
app.get('/logout', (req,res) => {
  req.session.destroy( (err) => {
    console.log('Error while destroying the session:', err);
  })
  console.log('Logged Out...');
  res.redirect('/');
});

app.listen(8080);
