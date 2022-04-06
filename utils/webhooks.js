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
