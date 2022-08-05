# Firebase Functions Sample App
This sample app show how to integrate Google Firebase Cloud Functions with the HostedHooks Webhooks API

### Related examples

- [To-Do app using Nextjs](https://github.com/HostedHooks/nextjs-sample-app)

## How to use

    $ git clone https://github.com/HostedHooks/firebase-functions-sample-app.git

    $ cd firebase-functions-sample-app

## Configuration

### Step 1. Create an account on hostedhooks

First, [create an account on hostedhooks](https://hostedhooks.com/sign_up).

### Step 2. Generate an app for your webhooks

After creating your account, you need to [generate a new app](https://docs.hostedhooks.com/getting-started/webhooks/setup-your-app#1-generate-an-app) where events will occur. This app is what your webhook subscribers will be subscribing to.

### Step 3. Create a Webhook Event for your app instance

After creating your app, it's the time to prepare our app to recieve webhooks, let's create a Webhook Event that subscribers can subscribe to.

In our Firebase App, we create a `user.created` event, that should be triggered whenever a new user is written in the database.

Here are some additional events that you may create for this Firebase App (but we won't cover these here):

* `user.updated` - triggers whenever a user is **updated**.

* `user.deleted` - triggers whenever a user is **deleted**.

We recommend you follow a convention when naming your events, something like `namespace.event` would work.

**Note:** The event name being sent from your application must match the event name of the webhook event created in your app instance and the webhook events must be created first.

For more info, you can review our [documentation](https://docs.hostedhooks.com/developer-resources/components/apps).

### Setup Firebase

#### 1. Signup and Install Firebase CLI

First you need to create a firebase project, you can do so by heading [here](https://console.firebase.google.com/). Once you have an account you need to install the Firebase CLI to manage and deploy your Firebase projects.

    $ npm install -g firebase-tools


That makes the `firebase` command global. For more information, checkout the [documentation](https://firebase.google.com/docs/cli#install_the_firebase_cli)

#### 2. Log in and test the Firebase CLI

After installing the CLI, you must authenticate. Then you can confirm authentication by listing your Firebase projects.


    $ firebase login

This command connects your local machine to Firebase and grants you access to your Firebase projects. For more information, checkout the [documentation](https://firebase.google.com/docs/cli#install_the_firebase_cli)

#### 3. Set up environment variables

Inside firebase `functions` folder in the root directory, copy the `.env.example` file to `.env` (which will be ignored by Git):

    $ cd functions
    $ cp .env.example .env

Then set each variable in the `.env` file :

* `HOSTEDHOOKS_API_KEY` must be the **API Key** from your [account settings](https://www.hostedhooks.com/settings/account).
* `APP_UUID` must be the **ID** of your HostedHooks app instance.

Your `.env` file should look like this:

    HOSTEDHOOKS_API_KEY=...
    APP_UUID=...

Within the same folder, run `npm install` to install the dependencies:

    $ npm install

### Set the event handler:

Firebase Cloud Functions supports event handlers for Realtime Database events, you can listen for creation, update and deletion events or any change at all. Check out the [full details here](https://firebase.google.com/docs/database/extend-with-functions#trigger_a_function).

In our demo app, we will be listening for the creation event and we do this by specifying the path of the instance that we want to listen to, `users` in this case.

Whenever a new user is added to the `users` instance, the `onCreate()` function fires. This takes a callback with the `snapshot` and `context` parameter. The `snapshot` parameter contains the data that was written to the database and the `context` parameter contains the params and authentication information. For more details, checkout Firebase [documentation](https://firebase.google.com/docs/database/extend-with-functions#handle_event_data)

Within the `onCreate()` function, we are taking the data received from the Firebase event and passing it into a `sendWebhookMessage` function which will kick off the API call to HostedHooks.

```js
// index.js
const functions = require("firebase-functions");
const { sendWebhookMessage } = require("./utils/webhooks");

exports.callHostedHooks = functions.database
  .ref("/users/{userId}")
  .onCreate((snapshot, context) => {
    // getting the newly created user data
    const createdUser = snapshot.val();
    console.log(createdUser);

    // getting the user ID
    const userId = context.params.userId 
    console.log(userId);

    // sending webhook message 
    return sendWebhookMessage("user.created", createdUser);
});
```
 
### Building your webhook message:

Here we show the internals of the `sendWebhookMessage` function which is taking all of the firebase data and building the API call to send the Webhook Message to HostedHooks. 

We start with the `url` which is the API endpoint that you will be sending the event data to. In this case it only requires the `APP_UUID` that we setup earlier in the `.env` file. You will want to dynamically add that into the endpoint URL. If this were a production platform we would recommend that you not store the `APP_UUID` in the env var, but for the sake of simplicity it's ok here.

Once you have the url next is the payload of the webhook message:

* `data`: It is your custom payload and the information that will be passed on to your webhook subscribers

* `version`: This is the version of the payload that you want to send. You can build different versions of your payloads without breaking your existing subscribers integrations.

* `event_type`: This is the webhook event that was triggered. It is the attribute that we use to route your webhook to the correct subscribers.


Once all of that is setup you are ready to start testing end to end.

```js
// ./utils/webhooks
const axios = require("axios");

exports.sendWebhookMessage = async (event, userData) => {
  var url = `https://www.hostedhooks.com/api/v1/apps/${process.env.APP_UUID}/messages`

  // webhook message
  var messagePayload = {
    data: {
      user: userData, // user data
    },
    version: "1.0",
    event_type: event, // ex: 'user.created'
  };

  var requestOptions = {
    headers: {
      Authorization: `Bearer ${process.env.HOSTEDHOOKS_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios.post(url, messagePayload, requestOptions);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};
```

### Triggering the function
Now you are all set to create a new user. Head into your console and click the "All Products" link on the sidebar, that will bring you to a view like the below. Click on "Realtime Database" and that will take you to your users database where you can add records.

![trigger firebase webhook event](https://user-images.githubusercontent.com/436003/181794810-b296c566-f856-4992-ad25-05f216423d2d.png)

Once in the Realtime Database view, hover over `users` and click the `+` button that appears. In the fields that show up, add random data to emulate adding a new user to the `users` collection. 

<img width="1408" alt="CleanShot 2022-08-01 at 06 51 33@2x" src="https://user-images.githubusercontent.com/436003/182132822-20f0880d-b8c5-4c6f-9c73-435c576d232f.png">

Once the record gets added to the database, our code listening for events will get triggered and a webhook message will be sent to Hostedhooks.

You can see this by jumping back in to your HostedHooks dashboard, where you will see the message that we sent has been recieved. 

![firebase google webhook message](https://user-images.githubusercontent.com/75076979/182418537-dc40ba65-fa65-4900-a179-c0a822d0e79c.png)

### Add Subscribers

Lastly, to show the full flow, we will need to setup a subscriber to receive the webhook data. The step above made an API call to HostedHooks letting the platform know that data has changed, but now we need to route that new event data to a webhook subscriber. In our example a subscriber might be a user of your application that wants to know whenever a new user signs up.

We've covered how to setup a subscriber in another article which is linked here [here](https://hostedhooks.com/blog/how-to-setup-your-hostedhooks-instance). Please follow along there and come back here once ready. 

Once your subscriber is setup and subecribed to the `user.created` event, we can rerun the previous step by manually entering a new user and we'll see the webhook flow end to end. 

The flow: Manually creating a user on our firebase database -> HostedHooks -> Subscriber endpoint

![subscriber](https://user-images.githubusercontent.com/75076979/182416839-c55492ee-78a6-4ed1-9ed6-fccd94fdff1e.gif)

This gif is showing us manually creating a user on our firebase database, then sending that event over to the HostedHooks API, routing to the subscriber that we created.

### Recap
To recap, we've just walked through how simple it is to setup Google Firebase serverless cloud functions to listen for database updates and send out webhooks. We hope this was helpful and if you have any questions, please reach out!

### Follow Us

You can follow us <a href='https://twitter.com/hostedhooks'>@hostedhooks</a> or sign up below to receive our updates. 
