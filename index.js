const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');

const DB = process.env.DB;

var PORT = process.env.PORT || process.env.PORT || 3001;
var HOST = process.env.YOUR_HOST || '0.0.0.0';
const mongoose = require("mongoose");
const corsWhitelist = [
    'http://localhost:5000',
    'http://localhost:5001',
    process.env.SERVER
];
let headers = (req, res, next) => {
    // Website you wish to allow to connect
   //res.setHeader("Access-Control-Allow-Origin", "https://chokhonelidze.github.io/,http://localhost:5000,http://myhome.smho.site:5000");
   if(corsWhitelist.indexOf(req.headers.origin) !== -1) {
   res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
   }

   // Request methods you wish to allow
   res.header(
     "Access-Control-Allow-Methods",
     "Authorization,GET,PUT,POST,DELETE,PATCH,OPTIONS"
   );

   // Request headers you wish to allow
   //res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,text/plain');
   res.setHeader("Access-Control-Allow-Headers", "*");

   // Set to true if you need the website to include cookies in the requests sent
   // to the API (e.g. in case you use sessions)
   res.setHeader("Access-Control-Allow-Credentials", true);

   // Pass to next layer of middleware
   next();
 }


mongoose.connect(DB, { useNewUrlParser: true }).then(() => {
  const indexes = require("./models/indexes");
  const users = require("./models/account");
  const accessTokenSecret = 'somerandomaccesstoken';
  const refreshTokenSecret = 'somerandomstringforrefreshtoken';

  const app = express();
  app.use(headers);
  app.use(bodyParser.json());
  let refreshTokens = [];
  app.post("/login", async (req, res) => {
      const {name,password} = req.body;
      let filter = {
          name:name,
          password:password
      }
      const isUser = await users.findOne(filter);
      console.log(isUser);
      if(isUser && isUser.name) {
        const accessToken = jwt.sign({ username: isUser.name, role: isUser.role }, accessTokenSecret, { expiresIn: '20m' });
        const refreshToken = jwt.sign({ username: isUser.name, role: isUser.role }, refreshTokenSecret);
        refreshTokens.push(refreshToken);

        res.json({
            accessToken,
            refreshToken
        });
      }
     else {
        res.status(404).send('Username or password incorrect');
    } 
  });
  app.post('/token',async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }

    jwt.verify(token, refreshTokenSecret, async (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        const accessToken = await jwt.sign({ username: user.username, role: user.role }, accessTokenSecret, { expiresIn: '20m' });

        res.json({
            accessToken
        });
    });
    
});
app.post('/logout', async (req, res) => {
    const {token} = req.body;
    refreshTokens = await refreshTokens.filter(t => t !== token);

    res.send("Logout successful");
});

app.listen(PORT,HOST, () => {
    console.log('Authentication service started on port '+PORT);
});

});
