/*
 - Required External Modules
 */

const express = require("express");
const bodyParser = require("body-parser")
const path = require("path");
const expressSession = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

require("dotenv").config();

const authRouter = require("./routes/auth")
const checkAuth = require("./lib/middleware/isAuthenticated")
const main = require("./routes/main")
const profile = require("./routes/profile")
const issues = require("./routes/issues")
const projects = require("./routes/projects")



/*
 - App Variables
 */

const app = express();
const port = process.env.PORT || "8080";


/*
 - Session Configuration
 */

const session = {
	secret: "GOOD_WILL_HUNTING_JACK_REACHER_JOHN_WICK_SHAWSHANK_REDEMPTION",
	cookie: {},
	resave: false,
	saveUninitialized: false
  };
  
  if (app.get("env") === "production") {
	// Serve secure cookies, requires HTTPS
	session.cookie.secure = true;

	// Uncomment the line below if your application is behind a proxy (like on Heroku)
  	// or if you're encountering the error message:
  	// "Unable to verify authorization request state"
  	// app.set('trust proxy', 1);
  }


/*
 - Passport Configuration
 */

const strategy = new Auth0Strategy(
	{
		domain: process.env.AUTH0_DOMAIN,
		clientID: process.env.AUTH0_CLIENT_ID,
		clientSecret: process.env.AUTH0_CLIENT_SECRET,
		callbackURL: process.env.AUTH0_CALLBACK_URL || "http://localhost:8080/callback"
	},
	function(accessToken, refreshToken, extraParams, profile, done) {
		/*
		- Access tokens are used to authorize users to an API
		- (resource server)
		- accessToken is the token to call the Auth0 API
		- or a secured third-party API
		- extraParams.id_token has the JSON Web Token
		- profile has all the information from the user
		*/
		return done(null, profile);
	}
);


/*
 -  App Configuration
 */

app.use(bodyParser.urlencoded({extended:true}))
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

app.use(expressSession(session));

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
	done(null, user);
});
  
passport.deserializeUser((user, done) => {
	done(null, user);
});


// isAuthenticated
app.use(checkAuth)

// Router mounting
app.use("/",authRouter)
app.use("/",main)
app.use("/profile",profile)
app.use("/issues",issues)
app.use("/projects",projects)

// port listening to requests
app.listen(port)