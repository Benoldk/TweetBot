const fs = require('fs');
const twitterClient = require("./twitterClient")
const CronJob = require("cron").CronJob;
const express = require("express");
const expressApp = express();
const port = process.env.PORT || 4000;

let index = 0;
const MAXTWEETS = 31;
const TWEETLEN = 280;

expressApp.listen(port, () => {
    console.log(`listening on port ${port}`);
})

function loadDataFromFile(filename) {
    console.log(`loading file ${filename}`);
    return fs.readFileSync(filename).toString().split("\n");
}

function loadTweets(tweetsFilename, maxTweets, shuffle = false) {
    console.log(`Loading tweets...`)
    let tweetData = loadDataFromFile(tweetsFilename);
    if (shuffle)
        tweetData = shuffleArray(tweetData);
    var result = tweetData.slice(0, maxTweets);
    console.log(`Succesfully loaded a total of ${maxTweets} tweets`);
    return result;
}

function shuffleArray(arr) {
    var len = arr.length;
    var d = len;
    var array = [];
    var k, i;
    for (i = 0; i < d; i++) {
        k = Math.floor(Math.random() * len);
        array.push(arr[k]);
        arr.splice(k, 1);
        len = arr.length;
    }
    for (i = 0; i < d; i++) {
        arr[i] = array[i];
    }
    return arr;
}

const postTweet = async (tweet, count) => {
    try {
        await twitterClient.v2.tweet(tweet);
        console.log(`${new Date().toLocaleString()} - #${count + 1} successfully tweeted:`, tweet);
    }
    catch (e) {
        console.error(`${new Date().toLocaleString()} - Error sending tweet #${count + 1}: ${tweet}\r\n`, e);
    }
}

const formFullTweet = (tweet, hashTags) => {
    var randHashtagIndex = Math.floor(Math.random() * hashTags.length);
    const hashtagsStr = hashTags[randHashtagIndex];
    const fullTweet = `${tweet} \r\n ${hashtagsStr}`;
    return fullTweet;
}

const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayofWeek = weekday[new Date().getDay()];
let tweetsFilename = `./Resources/Tshirts-TweetList-${dayofWeek}.txt`;
const tweets = loadTweets(tweetsFilename, MAXTWEETS);

let hashtagsFilename = `./Resources/hashtags.txt`;
const hashTags = loadDataFromFile(hashtagsFilename);

const cronTweet = new CronJob('*/3 * * * *', async () => {
    const tweet = tweets[index];
    if (tweet) {
        let fullTweet = formFullTweet(tweet, hashTags);
        postTweet(fullTweet.substring(0, TWEETLEN), index);

        // exit application
        if (index == tweets.length - 1) {
            console.log(`${new Date().toLocaleString()} - Exiting application`);
            process.exit(1);
        }

        index = (index + 1) % tweets.length;
    }
});

cronTweet.start();