
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const cors = require('cors');


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});



// Endpoint to handle prompt generation
app.get('/', (req, res) => {
    res.send("Hello");
})
app.post('/generate', async (req, res) => {
    const { rawPrompt, industry, role, context } = req.body;
    const prompts = await generatePrompts(rawPrompt, industry, role, context);
    console.log(prompts);
    res.json({ prompts });
});



async function generatePrompts(rawPrompt, industry, role, context) {
    try {
        let prompts = [];


        const prompt1 = await generatePromptFromAPI(rawPrompt, industry, role, context);
        prompts = prompt1.split('\n');
        // prompts = prompts.filter((p, i) => i % 2 === 0);
        // console.log(prompts);




        return prompts;
    } catch (error) {
        console.error('Error generating prompts:', error);
        return [];
    }
}

// async function generatePromptFromAPI(rawPrompt, industry, role, context) {



//     try {
//         const contextMessage = context.length > 1 ? `with this context : ${context}\n` : '';

//         const response = await openai.chat.completions.create({
//             messages: [{
//                 role: "system",
//                 content: `
//                     Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to generate the set of suggestions on how to optimize the following prompt below in order to generate more effective and relevant response from chatGPT.

//                     Context: I work in the ${industry} industry, and my role is working as a ${role}.

//                     Prompt: "${rawPrompt}"

//                     Create a prompt from the above suggestion to get a response and information to the best of your ability. 
//                     Provide the information and details to the above prompt to the best of your ability.
//                 `
//             }],
//             model: "gpt-3.5-turbo",
//         });






//         const generatedPrompt = response.choices[0].message.content;

//         return generatedPrompt;
//     } catch (error) {
//         console.error('Error generating prompt from API:', error);
//         return '';
//     }
// }



async function generatePromptFromAPI(rawPrompt, industry, role, context) {
    try {


        // Step 1: Initial Call to Get Suggestions
        const initialPrompt = `
            Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to generate the set of suggestions on how to optimize the following prompt below in order to generate more effective and relevant response from chatGPT.

            Context: I work in the ${industry} industry, and my role is working as a ${role}.

            Prompt: "${rawPrompt}"

            Create a prompt from the above suggestion to get a response and information to the best of your ability. 
            Provide the information and details to the above prompt to the best of your ability.
        `;

        const suggestionsResponse = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: initialPrompt
            }],
            model: "gpt-3.5-turbo",
        });

        console.log(suggestionsResponse);
        const suggestions = suggestionsResponse.choices[0].message.content;

        // Step 2: Refine Prompt with Suggestions
        const refinedPrompt = `
            Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to optimize the following prompt below in order to generate more effective and relevant response from chatGPT.

            Context: I work in the ${industry} industry, and my role is working as a ${role}.

            Original Prompt: "${rawPrompt}"

            Suggestions: ${suggestions}

            Create a refined prompt from the above suggestions to elicit a more informative response. 
            Provide the information and details to the refined prompt to the best of your ability.
        `;

        const refinedResponse = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: refinedPrompt
            }],
            model: "gpt-3.5-turbo",
        });
        const refinedPromptGenerated = refinedResponse.choices[0].message.content;

        // Step 3: Final Call for Generating Effective Prompt
        const finalPrompt = `
            Act as a prompt engineer. As an experienced and renowned prompt engineer, you possess the expertise to craft high-quality prompts that yield accurate and relevant responses from GPT. Your skills in promoting are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my prompts. Objective: your task is to generate the most effective prompt based on the following refined prompt below.

            Context: I work in the ${industry} industry, and my role is working as a ${role}.

            Refined Prompt: "${refinedPromptGenerated}"

            Craft a highly detailed and effective prompt from the refined prompt above. 
            Your goal is to elicit the most informative response possible from GPT.
        `;

        const finalResponse = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: finalPrompt
            }],
            model: "gpt-3.5-turbo",
        });
        const finalPromptGenerated = finalResponse.choices[0].message.content;
        console.log(finalPromptGenerated);

        return finalPromptGenerated;

    } catch (error) {
        console.error('Error generating prompt from API:', error);
        return '';
    }
}




app.listen(port, () => {


    console.log(`Server is running on port ${port}`);
});
