async function summarizeText(text, paraOrBullet, summaryLength, keywords, openai) {
    try {
        const inputChunks = splitText(text);
        const outputChunks = [];

        for (const chunk of inputChunks) {
            console.log("c1", chunk);
            const response = await openai.chat.completions.create({
                messages: [{ role: "system", content: `Please summarize the following chunk of text:\n${chunk}\n\n Keywords: [${keywords}] Keep the summary length to ${summaryLength} characters and format it as ${paraOrBullet} summary:` }],
                model: "gpt-3.5-turbo",
            });
            // console.log(response);

            const summary = response.choices[0]?.message.content;

            outputChunks.push(summary);
        }

        return outputChunks.join(' ');
    } catch (error) {
        console.error('Error in summarizeText:', error.message);
        throw error;
    }
}

function splitText(text, openai) {
    const maxChunkSize = 2048;
    const chunks = [];
    let currentChunk = '';

    for (const sentence of text.split('.')) {
        if (currentChunk.length + sentence.length < maxChunkSize) {
            currentChunk += sentence + '.';
        } else {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + '.';
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function generateEmail(prompt, openai) {
    try {
        const email = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: prompt
            }],
            model: "gpt-3.5-turbo",
        });
        const emailGenerated = email.choices[0].message.content.trim();
        return emailGenerated;
    }
    catch (error) {
        console.error('Error generating email:', error);
        throw error;
    }
}




async function generateSocialMediaPost(prompt, openai) {
    try {
        const post = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: prompt
            }],
            model: "gpt-3.5-turbo",
        });
        const postContent = post.choices[0].message.content.trim();
        return postContent;
    }
    catch (error) {
        console.error('Error generating social media post:', error);
        throw error;
    }
}

// Function to generate prompt for the given context
async function socialMediaPrompt(context, openai) {
    try {
        // Construct the initial prompt for generating prompt
        const initialPrompt = `
            Act as a social media content creator. As an experienced and renowned content creator, you possess the expertise to craft engaging social media posts that resonate with your audience. Your skills in content creation are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my social media posts. 
            Objective: your task is to generate a social media post for the following context.

            Context: ${context}\n

            Create a social media post for the above context given by the user to the best of your ability.

            Post:\n\n`;

        // Call the OpenAI API to generate prompt
        const suggestionsResponse = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: initialPrompt
            }],
            model: "gpt-3.5-turbo",
        });

        // Extract and return the generated prompt
        const prompt = suggestionsResponse.choices[0].message.content.trim();
        return prompt;
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw error;
    }
}





async function generatePrompts(rawPrompt, industry, role, context, openai) {
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




async function generatePrompt(context, openai) {
    try {
        // Construct the initial prompt for generating prompt
        const initialPrompt = `
            Act as an email writer. As an experienced and renowned email writer, you possess the expertise to craft high-quality emails that yield accurate and relevant responses from GPT. Your skills in email writing are unmatched, and I am excited to tap into your knowledge to further enhance the quality of my emails. 
            Objective: your task is to generate an email for the following context.

            Context: ${context}\n

            Create an email for the above context given by the user to the best of your ability. Write body of email in from next line of subject add new line character where needed.
            Objective: Create email in structure HTML format in a div and place different part of email in different html element. So that it will be easy to so on frontend.
            Email:\n\n`;

        // Call the OpenAI API to generate prompt
        const suggestionsResponse = await openai.chat.completions.create({
            messages: [{
                role: "system",
                content: initialPrompt
            }],
            model: "gpt-3.5-turbo",
        });

        // Extract and return the generated prompt
        const prompt = suggestionsResponse.choices[0].message.content;
        return prompt;
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw error;
    }
}



async function generatePromptFromAPI(rawPrompt, industry, role, context, openai) {
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


module.exports = { generateSocialMediaPost, socialMediaPrompt, generatePrompt, generatePrompts, generateEmail, splitText, summarizeText };



