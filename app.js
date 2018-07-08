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

const header = `    
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/css/bootstrap.min.css" integrity="sha384-WskhaSGFgHYWDcbwN70/dfYBj47jz9qbsMId/iRN3ewGhXQFZCSftd1LZCfmhktB" crossorigin="anonymous">
`;

const scripts = `<!-- Optional JavaScript -->
<!-- jQuery first, then Popper.js, then Bootstrap JS -->
<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/js/bootstrap.min.js" integrity="sha384-smHYKdLADwkXOn1EmN1qk/HfnUcbVRZyYmZ4qpPea6sjB/pTJ0euyQp0Mk8ck+5T" crossorigin="anonymous"></script>
`;

app.use(fileUpload());
app.use(express.static('www'));
app.use(function (err, req, res, next) {
    res.status(500).send(simpleHtml("An error occurred."))
});

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

    return renderHtml(`
<b>INGREDIENTS</b><br>
<ul>
${ingredients.map(i => "<li>" + i).join("\n")}
</ul>
`)
}

function renderHtml(bodyHtml) {
    return `
<html>
<head>
${header}
<title>Kimbo Prototype App</title>
</head>
<body>
${bodyHtml}
<p><a href="/">Try again...</a></p>
${scripts}
</body>
</html>
`
}

function simpleHtml(message) {
    return renderHtml(`<p>${message}</p>`)
}

app.post('/upload_ingredients', function(req, res) {
    if (!req.files || !req.files.ingredients) {
        return res.status(400).send(simpleHtml("No files were uploaded."));
    }

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
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
// [END app]
