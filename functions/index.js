const functions = require("firebase-functions");
const { sendWebhookMessage } = require("./utils/webhooks");

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.callHostedHooks = functions.database
  .ref("/users/{userId}")
  .onCreate((snapshot, context) => {
    const createdUser = snapshot.val();
    console.log(createdUser);
    const userId = context.params.userId 
    console.log(userId);
    return sendWebhookMessage("user.created", createdUser);
  });
