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
const flatMap = require('flatmap');

const app = express();

const client = new vision.ImageAnnotatorClient();

app.use(fileUpload());
app.use(express.static('www'));

function getParagraphsFromTextAnnotation(fullTextAnnotation) {
    return flatMap(fullTextAnnotation.pages, page => {
        return flatMap(page.blocks, block => {
            return block.paragraphs.map(paragraph => {
                const wordsInParagraph = paragraph.words.map(word => {
                    return word.symbols.map(s => s.text).join("")
                });
                console.log("Paragraph: " + wordsInParagraph.join(" "));
                return wordsInParagraph.join(" ")
            });
        })
    });
}

function isConsistentCase(text) {
    return text === text.toLowerCase() || text === text.toUpperCase()
}

function hasWordsUncommonToIngredients(ingredient) {
    const articleRegex = /(^|[^a-z])(a|and|the|or|by)($|[^a-z])/i;

    return articleRegex.test(ingredient)
}

function wordCount(text) {
    return text.split(/\s+/).length
}

function isPossibleIngredient(ingredient) {
    const containsLetters = /[A-Z]/i

    return containsLetters.test(ingredient) && wordCount(ingredient) <= 4
}

function extractIngredientsFromText(text) {
    const ingredientsRegex = /.*(ingredients|made\s+of)/i

    if (ingredientsRegex.test(text)) {
        const ingredientListSubstring = text.replace(ingredientsRegex, "");

        return ingredientListSubstring.split(/\s*[.,:;()]\s*/).filter(isPossibleIngredient).map(s => s.toLowerCase())
    } else {
        return []
    }
}

function extractIngredientsFromTextAnnotation(textAnnotation) {
    const paragraphs = getParagraphsFromTextAnnotation(textAnnotation);

    return flatMap(paragraphs, extractIngredientsFromText)

    // const lines = textAnnotation.text.split("\n");
    // var ingredientsBegun = false;
    //
    // const ingredientStringFragments = flatMap(lines, line => {
    //     if (!ingredientsBegun) {
    //         if (isFirstLineOfIngredients(line)) {
    //             ingredientsBegun = true
    //         }
    //     }
    // })
}

function renderIngredientsToHtmlFromTextAnnotation(textAnnotation) {
    const ingredients = extractIngredientsFromTextAnnotation(textAnnotation);

    return `<b>INGREDIENTS</b><br>
<ul>
${ingredients.map(i => "<li>" + i).join("\n")}
</ul>
`
}

app.post('/upload_ingredients', function(req, res) {
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    let ingredients = req.files.ingredients;

    const request = {
        image: {
            content: ingredients.data
        },
        imageContext: {
            languageHints: [ "en" ]
        }
    };
    client
        .documentTextDetection(request)
        .then(results => {
            const textAnnotation = results[0].fullTextAnnotation;

            console.log(textAnnotation.text);
            res.status(200).send(renderIngredientsToHtmlFromTextAnnotation(textAnnotation))
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
