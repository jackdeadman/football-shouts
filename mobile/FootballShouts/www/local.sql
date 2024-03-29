PRAGMA synchronous = OFF;
PRAGMA journal_mode = MEMORY;
BEGIN TRANSACTION;
DROP TABLE IF EXISTS "Authors";
CREATE TABLE "Authors" (
  "id" INTEGER PRIMARY KEY,
  "twitterHandle" varchar(15) NOT NULL,
  "name" varchar(20) NOT NULL,
  "profileImageUrl" varchar(255) DEFAULT NULL
);
DROP TABLE IF EXISTS "Clubs";
CREATE TABLE "Clubs" (
  "id" INTEGER PRIMARY KEY,
  "name" varchar(255) NOT NULL
);
DROP TABLE IF EXISTS "Hashtags";
CREATE TABLE "Hashtags" (
  "id" INTEGER PRIMARY KEY,
  "hashtag" varchar(100) NOT NULL
);
DROP TABLE IF EXISTS "PlayerPositions";
CREATE TABLE "PlayerPositions" (
  "playerId" int(11) NOT NULL,
  "positionId" int(11) NOT NULL,
  PRIMARY KEY ("playerId","positionId")
  CONSTRAINT "PlayerPositions_ibfk_1" FOREIGN KEY ("playerId") REFERENCES "Players" ("ROWID") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PlayerPositions_ibfk_2" FOREIGN KEY ("positionId") REFERENCES "Positions" ("ROWID") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "Players";
CREATE TABLE "Players" (
  "id" INTEGER PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "twitterHandle" varchar(15) DEFAULT NULL,
  "imageUrl" varchar(255) DEFAULT NULL,
  "dateOfBirth" datetime DEFAULT NULL,
  "shirtNumber" int(11) DEFAULT NULL,
  "currentClubId" int(11) DEFAULT NULL,
  CONSTRAINT "Players_ibfk_1" FOREIGN KEY ("currentClubId") REFERENCES "Clubs" ("ROWID") ON DELETE SET NULL ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "Positions";
CREATE TABLE "Positions" (
  "id" INTEGER PRIMARY KEY,
  "name" varchar(255) NOT NULL
);
DROP TABLE IF EXISTS "TweetHashtags";
CREATE TABLE "TweetHashtags" (
  "hashtagId" int(11) NOT NULL,
  "tweetId" int(11) NOT NULL,
  PRIMARY KEY ("hashtagId","tweetId")
  CONSTRAINT "TweetHashtags_ibfk_1" FOREIGN KEY ("hashtagId") REFERENCES "Hashtags" ("ROWID") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TweetHashtags_ibfk_2" FOREIGN KEY ("tweetId") REFERENCES "Tweets" ("ROWID") ON DELETE CASCADE ON UPDATE CASCADE
);
DROP TABLE IF EXISTS "Tweets";
CREATE TABLE "Tweets" (
  "id" INTEGER PRIMARY KEY,
  "text" varchar(140) NOT NULL,
  "twitterId" varchar(30) NOT NULL,
  "datePublished" datetime NOT NULL,
  "hasMedia" tinyint(1) NOT NULL,
  "retweetCount" int(11) NOT NULL,
  "favouriteCount" int(11) NOT NULL,
  "transferClubId" int(11) DEFAULT NULL,
  "PlayerId" int(11) DEFAULT NULL,
  "AuthorId" int(11) DEFAULT NULL,
  CONSTRAINT "Tweets_ibfk_1" FOREIGN KEY ("transferClubId") REFERENCES "Clubs" ("ROWID") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Tweets_ibfk_2" FOREIGN KEY ("PlayerId") REFERENCES "Players" ("ROWID") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Tweets_ibfk_3" FOREIGN KEY ("AuthorId") REFERENCES "Authors" ("ROWID") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Players_name" ON "Players" ("name");
CREATE INDEX "Players_Players_name_unique" ON "Players" ("name");
CREATE INDEX "Players_twitterHandle" ON "Players" ("twitterHandle");
CREATE INDEX "Players_Players_twitterHandle_unique" ON "Players" ("twitterHandle");
CREATE INDEX "Players_currentClubId" ON "Players" ("currentClubId");
CREATE INDEX "Hashtags_hashtag" ON "Hashtags" ("hashtag");
CREATE INDEX "Hashtags_Hashtags_hashtag_unique" ON "Hashtags" ("hashtag");
CREATE INDEX "Clubs_name" ON "Clubs" ("name");
CREATE INDEX "Clubs_Clubs_name_unique" ON "Clubs" ("name");
CREATE INDEX "PlayerPositions_positionId" ON "PlayerPositions" ("positionId");
CREATE INDEX "Tweets_twitterId" ON "Tweets" ("twitterId");
CREATE INDEX "Tweets_Tweets_twitterId_unique" ON "Tweets" ("twitterId");
CREATE INDEX "Tweets_transferClubId" ON "Tweets" ("transferClubId");
CREATE INDEX "Tweets_PlayerId" ON "Tweets" ("PlayerId");
CREATE INDEX "Tweets_AuthorId" ON "Tweets" ("AuthorId");
CREATE INDEX "TweetHashtags_tweetId" ON "TweetHashtags" ("tweetId");
CREATE INDEX "Authors_twitterHandle" ON "Authors" ("twitterHandle");
CREATE INDEX "Authors_Authors_twitterHandle_unique" ON "Authors" ("twitterHandle");
END TRANSACTION;
