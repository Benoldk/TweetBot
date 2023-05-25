const fs = require('fs');
const twitterClient = require("./twitterClient")
const CronJob = require("cron").CronJob;
const express = require("express");
const expressApp = express();
const port = process.env.PORT || 4000;

expressApp.listen(port, () => {
    console.log(`listening on port ${port}`);
})


function loadTweets() {
    return fs.readFileSync('tweets.txt').toString().split("\n");
}

const postTweets = async (tweet) => {
    try {
        await twitterClient.v2.tweet(tweet);
        console.log(`${new Date().toUTCString()} - successfully tweeted: `, tweet);
    }
    catch (e) {
        console.error(`${new Date().toUTCString()} - Error sending tweet: ${tweet}\r\n`, e);
    }
}

let index = 0;
const tweets = loadTweets();
const cronTweet = new CronJob("*/6 * * * *", async () => {
    const tweet = tweets[index];
    if (tweet) {
        postTweets(tweet);
        index = (index + 1) % tweets.length;
    }

    if (index === tweet.length) {
        console.log(`${new Date().toUTCString()} - Exiting application`);
        process.exit(1);
    }
});

cronTweet.start();