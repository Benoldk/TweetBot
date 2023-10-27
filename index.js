const fs = require('fs');
const twitterClient = require("./twitterClient")
const CronJob = require("cron").CronJob;
const express = require("express");
const expressApp = express();
const port = process.env.PORT || 4000;

let index = 0;
const MAXTWEETS = 50;
const TWEETLEN = 280;

expressApp.listen(port, () => {
    console.log(`listening on port ${port}`);
})

function loadDataFromFile(filename, separator) {
    console.log(`loading file ${filename}`);
    return fs.readFileSync(filename).toString().split(separator);
}

function loadTweets(tweetsFilename, maxTweets, shuffle = false) {
    console.log(`Loading tweets...`);
    let tweetData = loadDataFromFile(tweetsFilename, "\n");
    if (shuffle)
        tweetData = shuffleArray(tweetData);
    var result = tweetData.slice(0, maxTweets);
    console.log(`Succesfully loaded a total of ${result.length} tweets`);
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

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayofWeek = weekday[new Date().getDay()];
let linksFilename = `./Resources/Tshirt-Links-${dayofWeek}.txt`;

let tweetsFilename = `./Resources/Tshirt-TweetList.txt`;
const tweets = loadTweets(tweetsFilename, MAXTWEETS);

let hashtagsFilename = `./Resources/hashtags.txt`;
const hashTags = loadDataFromFile(hashtagsFilename, " ");

const linksList = loadDataFromFile(linksFilename, "\n");
const sales = [
    "",
    "15% OFF with code BRIGHT15",
    "20% OFF SALE",
    "10% OFF SALE"
];
const curretSaleIndex = 0;
const currentSale = sales[curretSaleIndex];

const postTweet = async (tweet, count) => {
    try {
        await twitterClient.v2.tweet(tweet);
        console.log(` ${new Date().toLocaleString()} - #${count + 1} successfully tweeted: ${tweet}\r\n\r\n`);
    }
    catch (exception) {
        console.error(` ${new Date().toLocaleString()} - Exiting Application.\r\nEncounteted error while sending tweet #${count + 1}: ${tweet}\r\n`, exception);
        process.exit(1);
    }
}

const tweetCronJob = new CronJob('*/3 * * * *', async () => {
    try {
        const link = linksList[index];
        if (link) {
            let tweetHashtags = shuffleArray(hashTags);
            const hashtagCount = randomIntFromInterval(2, 5);
            tweetHashtags = tweetHashtags.slice(0, hashtagCount);

            let tweet = shuffleArray(tweets)[0];
            tweet = tweet.replace("[SALE]", `${currentSale}\r\n\r\n`);
            tweet = tweet.replace("[LINK]", `${link}\r\n\r\n`);
            tweet = tweet.replace("[HASHTAG]", `${tweetHashtags}\r\n\r\n`);

            postTweet(tweet, index);

            // exit application
            if (index == linksList.length-1) {
                console.log(`${new Date().toLocaleString()} - Exiting application.`);
                process.exit(1);
            }

            index = (index + 1) % linksList.length;
        }
    }
    catch(exception) {
        console.log(`${new Date().toLocaleString()} - Exiting application on FATAL ERROR. ${ex}`);
        process.exit(1);
    }
});

tweetCronJob.start();