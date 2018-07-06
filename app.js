/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// [START app]
const express = require('express');
const fileUpload = require('express-fileupload');
const vision = require('@google-cloud/vision');

const app = express();

const client = new vision.ImageAnnotatorClient();

app.use(fileUpload());
app.use(express.static('www'));

app.post('/upload_ingredients', function(req, res) {
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    let ingredients = req.files.ingredients;

    const request = {
        image: {
            content: ingredients.data
        }
    };
    client
        .textDetection(request)
        .then(results => {
            const labels = results[0].textAnnotations;

            console.log('Labels:');
            labels.forEach(label => console.log(label.description));
            res.status(200).send(labels.map(l => l.description).join(" -- "))
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
// [END app]
