import OpenAI from "openai";
import {openai as vercelOpenAI} from '@ai-sdk/openai';
import {streamText} from 'ai';
import {DataAPIClient} from "@datastax/astra-db-ts";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE});

export async function POST(req: Request) {
    try {
        const {messages} = await req.json();
        const latestMessage = messages[messages?.length - 1]?.content;

        let docContext = "";

        // Get embedding for the latest user question
        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: "float"
        });

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION);

            // Only vector sort is allowed!
            const cursor = collection.find(
                null,
                {
                    sort: {
                        $vector: embedding.data[0].embedding
                    },
                    limit: 20, // Fetch more to allow for recency filtering
                }
            );

            let documents = await cursor.toArray();

            // Now sort by recency in code (descending by updatedAt)
            documents = documents
                .filter(doc => doc.updatedAt) // Ensure updatedAt exists
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 10); // Take the 10 most recent among the most relevant

            const docsMap = documents?.map(doc =>
                `Source: ${doc.sourceUrl}\nLast Updated: ${doc.updatedAt}\n${doc.text}`
            );

            docContext = docsMap.join('\n\n---\n\n');
        } catch (err) {
            console.error("Error querying db...", err);
            docContext = "";
        }

        const template = {
            role: "system",
            content: `You are an AI assistant who knows everything about Formula One.
Use the below context to augment what you know about Formula One racing.
The context will provide you with the most recent page data from Wikipedia, the official F1 website, and others.
If the context doesn't include the information you need, answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include.
Format responses using markdown where applicable and don't return images.

---------------------------------
START CONTEXT
${docContext}
END CONTEXT
---------------
QUESTION: ${latestMessage}
------------------
`
        };

        const response = await streamText({
            model: vercelOpenAI('gpt-4o'),
            system: template.content,
            messages
        });

        return response.toDataStreamResponse();
    } catch (e) {
        console.error(e);
        return new Response('Internal Server Error', {status: 500});
    }
}
