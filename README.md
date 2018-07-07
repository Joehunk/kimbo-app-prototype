# Super Secret Kimbo App Prototype

This application is built and deployed with the [Google App Engine](https://cloud.google.com/appengine/) using Node.js.
It uses the [Goole Vision API](https://cloud.google.com/vision/) to extract text from photos of ingredient lists and
parses them into individual ingredients. It'll probably also do some more cool stuff later.

## Setup
The fastest way to get set up is to run through the [quick-start for the Google App Engine with Node.js](https://cloud.google.com/appengine/docs/flexible/nodejs/quickstart).
Once that is complete, you will have everything installed that you need for this application.

If you don't want to do that, you will have to make sure you have installed:
* Node.js 8 or later
* npm (Node package manager)
* [Google Cloud SDK](https://cloud.google.com/sdk/install)

## Running Locally
* Pull down source code
* `gcloud auth login`
    * This will open a browser and prompt you to enter your Google credentials. This is the account that will be used to calls to the Google Vision API. Don't worry the first 1000 calls per month are free.
* `npm install`
* `npm start`
* Open web browser to localhost:8080

## Deploying
* `gcloud config set project kimbo-app-prototype`
    * You only need to do this once to set your default project
* `gcloud app deploy`
    * This takes several minutes especially with slow upload speeds. Better to test locally where possible.