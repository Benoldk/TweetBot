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
        console.log("successfully tweeted: ", tweet);
    }
    catch (e) {
        console.error('Error sending tweet:', e);
    }
}

let index = 0;
const tweets = loadTweets();
const cronTweet = new CronJob("*/25 * * * *", async () => {
    const tweet = tweets[index];
    if (tweet) {
        postTweets(tweet);
        index = (index + 1) % tweets.length;
    }
});

cronTweet.start();