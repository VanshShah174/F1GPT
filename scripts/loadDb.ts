import {DataAPIClient} from "@datastax/astra-db-ts"
import {PuppeteerWebBaseLoader} from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai"

import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"

import "dotenv/config"
// import {a} from "js-tiktoken/dist/core-cb1c5044";
// import {SimilarityMetric} from "@langchain/community/dist/vectorstores/rockset";
// import {cli} from "yaml/dist/cli";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({apiKey: OPENAI_API_KEY})

const f1Data = [
    "https://en.wikipedia.org/wiki/Formula_One",
    "https://www.formula1.com/en/latest/all",
    'https://www.formula1.com/en/racing/2025',
    'https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship',
    'https://en.wikipedia.org/wiki/2025_Japanese_Grand_Prix',
    'https://en.wikipedia.org/wiki/2025_Monaco_Grand_Prix',
    'https://en.wikipedia.org/wiki/2025_Emilia_Romagna_Grand_Prix',
    'https://www.formula1.com/en/drivers',  // 2025 Drivers list
    'https://www.motorsport.com/f1/standings/2025/',
    'https://talksport.com/motorsport/3274284/canadian-grand-prix-2025-uk-time-tv-channel-live-stream-f1-race/',  // 2025 Canada GP preview
    'https://en.wikipedia.org/wiki/2025_Formula_One_Sim_Racing_World_Championship',
    'https://simple.wikipedia.org/wiki/2025_Formula_One_World_Championship',
    'https://racingnews365.com/formula-1-calendar-2025',
    'https://www.f1.com/'  // Official homepage
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric
        }
    })

    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of f1Data) {
        const content = await scrapePage(url)
        const chuncks = await splitter.splitText(content)
        for await (const chunk of chuncks) {
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            })
            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk,
            })
            console.log(res)
        }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true,
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return ( await loader.scrape())?.replace(/<[^>]*>?/gm,'')
}

createCollection().then(() => loadSampleData())




