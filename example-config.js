module.exports = {
  database: {
    database: "db_name",
    username: "username",
    password: "password",
    host: "localhost",
    dialect: "mysql"
  },
  twitter: {
    consumerKey: "",
    consumerSecret: "",
    accessToken: "",
    accessTokenSecret: ""
  },

  cache: {
    threshold: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
