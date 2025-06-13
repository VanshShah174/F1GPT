import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import crypto from "crypto";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const f1Data = [
    // Official and Wikipedia sources
    "https://en.wikipedia.org/wiki/Formula_One",
    "https://www.formula1.com/en/latest/all",
    "https://www.formula1.com/en/racing/2025",
    "https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship",
    "https://en.wikipedia.org/wiki/2025_Japanese_Grand_Prix",
    "https://en.wikipedia.org/wiki/2025_Monaco_Grand_Prix",
    "https://en.wikipedia.org/wiki/2025_Emilia_Romagna_Grand_Prix",
    "https://www.formula1.com/en/drivers",
    "https://www.f1.com/",
    "https://simple.wikipedia.org/wiki/2025_Formula_One_World_Championship",

    // Standings and calendar
    "https://www.motorsport.com/f1/standings/2025/",
    "https://racingnews365.com/formula-1-calendar-2025",

    // Salary and driver market (2025)
    "https://racingnews365.com/formula-1-salaries-2025",
    "https://motociclismo.pt/en/f1-salary-rankings-for-2025-verstappen-stays-on-top-hamiltons-ferrari-deal-shakes-up-the-pay-scale/",
    "https://www.independent.co.uk/f1/f1-2025-driver-lineup-b2705232.html",

    // News and analysis (current events, rumors, technical)
    "https://www.motorsport.com/f1/news/",
    "https://www.autosport.com/f1/",
    "https://planetf1.com/news/",
    "https://www.gpfans.com/en/f1-news/",
    "https://the-race.com/formula-1/",

    // Community and discussion (for breaking news and rumors)
    "https://www.reddit.com/r/formula1/",

    // Example race preview (can swap for latest race preview as needed)
    "https://talksport.com/motorsport/3274284/canadian-grand-prix-2025-uk-time-tv-channel-live-stream-f1-race/"
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100,
});

// Helper to compute a hash for a chunk
function hashChunk(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

const createCollection = async (
    similarityMetric: SimilarityMetric = "dot_product"
) => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 1536,
                metric: similarityMetric,
            },
        });
        console.log("Collection created or already exists:", res);
    } catch (err: any) {
        if (err.message?.includes("already exists")) {
            console.log("Collection already exists, continuing.");
        } else {
            throw err;
        }
    }
};

const upsertChunk = async (
    collection: any,
    chunk: string,
    vector: number[],
    url: string
) => {
    const chunkHash = hashChunk(chunk);

    // Check if this hash already exists in the DB
    const existing = await collection.findOne({ chunkHash });

    if (existing) {
        // Already up-to-date, skip
        return;
    }

    // Insert or update with the new chunk
    await collection.updateOne(
        { chunkHash }, // Use hash as unique key
        {
            $set: {
                $vector: vector,
                text: chunk,
                sourceUrl: url,
                updatedAt: new Date(),
                chunkHash,
            },
        },
        { upsert: true }
    );
};

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);

    for (const url of f1Data) {
        console.log(`Scraping: ${url}`);
        let content = "";
        try {
            content = await scrapePage(url);
            if (!content || content.length < 100) {
                console.warn(`Warning: No content or very little content from ${url}`);
                continue;
            }
        } catch (err) {
            console.error(`Error scraping ${url}:`, err);
            continue;
        }

        let chunks: string[] = [];
        try {
            chunks = await splitter.splitText(content);
        } catch (err) {
            console.error(`Error splitting text for ${url}:`, err);
            continue;
        }

        for (const chunk of chunks) {
            try {
                const embedding = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: chunk,
                    encoding_format: "float",
                });
                const vector = embedding.data[0].embedding;

                await upsertChunk(collection, chunk, vector, url);
            } catch (err) {
                console.error(`Error embedding/upserting chunk from ${url}:`, err);
            }
        }
        console.log(`Finished processing: ${url}`);
    }
    console.log("All URLs processed.");
};

const scrapePage = async (url: string): Promise<string> => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: { headless: true },
        gotoOptions: { waitUntil: "domcontentloaded" },
        evaluate: async (page, browser) => {
            // You can customize this to target specific selectors if needed
            const result = await page.evaluate(() => document.body.innerText);
            await browser.close();
            return result;
        },
    });
    // Remove excessive whitespace and HTML tags
    return (await loader.scrape())?.replace(/\s+/g, " ").trim() ?? "";
};

// MAIN EXECUTION
createCollection()
    .then(() => loadSampleData())
    .catch((err) => {
        console.error("Fatal error:", err);
        process.exit(1);
    });
