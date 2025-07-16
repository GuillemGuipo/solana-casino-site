import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY as string,
  appSecret: process.env.TWITTER_APP_SECRET as string,
  accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
  accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
});

// Function to tweet the coin flip result
export const tweetResult = async (tweetContent: string) => {
  //   const result = coinFlip();
  const tweet = "Hello fams, How are you today.😀";

  try {
    // Post the tweet to Twitter
    await client.v2.tweet(tweetContent);
    console.log(`Successfully tweeted: ${tweetContent}`);
  } catch (error) {
    console.error("Error posting tweet:", error);
  }
};
