
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
// import { YoutubeTranscript } from 'youtube-transcript';
const { YoutubeLoader } = require('langchain/document_loaders/web/youtube');
const { generateSocialMediaPost, socialMediaPrompt, generatePrompt, generatePrompts, generateEmail } = require('./lib');


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.static('public'));
// app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads'),
    filename: (req, file, cb) => cb(null, file.originalname) // Use the original filename
});

const upload = multer({ storage });

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});


app.use('/uploads', express.static('uploads'));

// const openai = new OpenAI({
//     apiKey: process.env.OPEN_AI_KEY,
// });



app.get('/', (req, res) => {
    res.send("Server  is running");
})



// handle mp3/text files to generate transcript/ extract text

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        let text;

        if (file.mimetype.includes('audio')) {
            console.log("here");
            const audioFileBuffer = await fs.readFile(file.path);

            const formData = new FormData();
            formData.append('file', audioFileBuffer, {
                filename: file.originalname, // Use the original filename
                contentType: file.mimetype
            });

            formData.append('model', 'whisper-1');
            console.log("here 2");

            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`
                }
            });
            console.log("yaha", response);

            text = response.data.text;
            // console.log("dd\n", text);

        } else {
            // Process text file
            // console.log("yaha see ");

            text = (await fs.readFile(file.path)).toString('utf-8');
        }
        // console.log(file);
        console.log("here 3\n", text);

        res.json({ text });
    } catch (error) {
        console.error(error);
        // res.status(500).send('Error processing file.');
    }
});

app.post("/urltranscript", async (req, res) => {
    const { url } = req.body;
    console.log(url);

    const loader = YoutubeLoader.createFromUrl(url, {
        language: "en",
        addVideoInfo: true,
    });

    const docs = await loader.load();
    console.log(docs[0].pageContent);
    res.json({ text: docs[0].pageContent })



})




app.post('/generate-summary', express.json(), async (req, res) => {
    const { text, paraOrBullet, summaryLength, keywords } = req.body;
    console.log(paraOrBullet, summaryLength);

    try {
        const summary = await summarizeText(text, paraOrBullet, summaryLength, keywords, openai);
        res.json({ summary });
    } catch (error) {
        console.error('Error generating summary:', error.message);
        res.status(500).send('Error generating summary.');
    }
});


// Generate prompts
app.post('/generate', async (req, res) => {
    const { rawPrompt, industry, role, context } = req.body;
    const prompts = await generatePrompts(rawPrompt, industry, role, context, openai);
    console.log(prompts);
    res.json({ prompts });
});

// Generate email
app.post('/emailgen', async (req, res) => {
    try {
        const { context } = req.body;

        // Generate prompt for the given context
        const prompt = await generatePrompt(context, openai);

        // Generate email based on the prompt
        const email = await generateEmail(prompt, openai);
        console.log(email);

        // Send the structured email back to the client
        res.json({ email });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate email' });
    }
});

// Generate socail media post
app.post('/socialmediagen', async (req, res) => {
    try {
        const { context } = req.body;

        // Generate prompt for the given context
        const prompt = await socialMediaPrompt(context, openai);

        // Generate social media post based on the prompt
        const post = await generateSocialMediaPost(prompt, openai);

        // Send the generated social media post back to the client
        res.json({ post });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate social media post' });
    }
});


// async function generateEmail(prompt) {
//     try {
//         const email = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: prompt
//             }],
//             model: "gpt-3.5-turbo",
//         });
//         const emailGenerated = email.choices[0].message.content.trim();
//         return emailGenerated;
//     }
//     catch (error) {
//         console.error('Error generating email:', error);
//         throw error;
//     }
// }




// async function generateSocialMediaPost(prompt) {
//     try {
//         const post = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: prompt
//             }],
//             model: "gpt-3.5-turbo",
//         });
//         const postContent = post.choices[0].message.content.trim();
//         return postContent;
//     }
//     catch (error) {
//         console.error('Error generating social media post:', error);
//         throw error;
//     }
// }

// // Function to generate prompt for the given context
// async function socialMediaPrompt(context) {
//     try {
//         // Construct the initial prompt for generating prompt
//         const initialPrompt = `
//             Act as a social media content creator. As an experienced and renowned content creator, you possess the expertise to craft engaging social media posts that resonate with your audience. Your skills in content creation are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my social media posts.
//             Objective: your task is to generate a social media post for the following context.

//             Context: ${context}\n

//             Create a social media post for the above context given by the user to the best of your ability.

//             Post:\n\n`;

//         // Call the OpenAI API to generate prompt
//         const suggestionsResponse = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: initialPrompt
//             }],
//             model: "gpt-3.5-turbo",
//         });

//         // Extract and return the generated prompt
//         const prompt = suggestionsResponse.choices[0].message.content.trim();
//         return prompt;
//     } catch (error) {
//         console.error('Error generating prompt:', error);
//         throw error;
//     }
// }

// module.exports = { generateSocialMediaPost, socialMediaPrompt };




// async function generatePrompts(rawPrompt, industry, role, context) {
//     try {
//         let prompts = [];


//         const prompt1 = await generatePromptFromAPI(rawPrompt, industry, role, context);
//         prompts = prompt1.split('\n');
//         // prompts = prompts.filter((p, i) => i % 2 === 0);
//         // console.log(prompts);




//         return prompts;
//     } catch (error) {
//         console.error('Error generating prompts:', error);
//         return [];
//     }
// }




// async function generatePrompt(context) {
//     try {
//         // Construct the initial prompt for generating prompt
//         const initialPrompt = `
//             Act as an email writer. As an experienced and renowned email writer, you possess the expertise to craft high-quality emails that yield accurate and relevant responses from GPT. Your skills in email writing are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my emails.
//             Objective: your task is to generate an email for the following context.

//             Context: ${context}\n

//             Create an email for the above context given by the user to the best of your ability. Write body of email in from next line of subject add new line character where needed.
//             Objective: Create email in structure HTML format in a div and place different part of email in different html element. So that it will be easy to so on frontend.
//             Email:\n\n`;

//         // Call the OpenAI API to generate prompt
//         const suggestionsResponse = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: initialPrompt
//             }],
//             model: "gpt-3.5-turbo",
//         });

//         // Extract and return the generated prompt
//         const prompt = suggestionsResponse.choices[0].message.content;
//         return prompt;
//     } catch (error) {
//         console.error('Error generating prompt:', error);
//         throw error;
//     }
// }

// async function generatePromptFromAPI(rawPrompt, industry, role, context) {
//     try {


//         // Step 1: Initial Call to Get Suggestions
//         const initialPrompt = `
//             Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to generate the set of suggestions on how to optimize the following prompt below in order to generate more effective and relevant response from chatGPT.

//             Context: I work in the ${industry} industry, and my role is working as a ${role}.

//             Prompt: "${rawPrompt}"

//             Create a prompt from the above suggestion to get a response and information to the best of your ability.
//             Provide the information and details to the above prompt to the best of your ability.
//         `;

//         const suggestionsResponse = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: initialPrompt
//             }],
//             model: "gpt-3.5-turbo",
//         });

//         console.log(suggestionsResponse);
//         const suggestions = suggestionsResponse.choices[0].message.content;

//         // Step 2: Refine Prompt with Suggestions
//         const refinedPrompt = `
//             Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to optimize the following prompt below in order to generate more effective and relevant response from chatGPT.

//             Context: I work in the ${industry} industry, and my role is working as a ${role}.

//             Original Prompt: "${rawPrompt}"

//             Suggestions: ${suggestions}

//             Create a refined prompt from the above suggestions to elicit a more informative response.
//             Provide the information and details to the refined prompt to the best of your ability.
//         `;

//         const refinedResponse = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: refinedPrompt
//             }],
//             model: "gpt-3.5-turbo",
//         });
//         const refinedPromptGenerated = refinedResponse.choices[0].message.content;

//         // Step 3: Final Call for Generating Effective Prompt
//         const finalPrompt = `
//             Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to generate the most effective prompt based on the following refined prompt below.

//             Context: I work in the ${industry} industry, and my role is working as a ${role}.

//             Refined Prompt: "${refinedPromptGenerated}"

//             Craft a highly detailed and effective prompt from the refined prompt above.
//             Your goal is to elicit the most informative response possible from GPT.
//         `;

//         const finalResponse = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: finalPrompt
//             }],
//             model: "gpt-3.5-turbo",
//         });
//         const finalPromptGenerated = finalResponse.choices[0].message.content;
//         console.log(finalPromptGenerated);

//         return finalPromptGenerated;

//     } catch (error) {
//         console.error('Error generating prompt from API:', error);
//         return '';
//     }
// }




app.listen(port, () => {


    console.log(`Server is running on port ${port}`);
});
