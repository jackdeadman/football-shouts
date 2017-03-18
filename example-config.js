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
    // How long oldest tweet must be before searching twitter
    threshold: 5 * 60 * 1000 // 5 mins
  }
};
