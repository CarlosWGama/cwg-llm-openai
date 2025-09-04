const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { HumanMessage } = require("@langchain/core/messages");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const { FaissStore } = require('@langchain/community/vectorstores/faiss');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

const { CheerioWebBaseLoader } = require('@langchain/community/document_loaders/web/cheerio');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

const { createRetrievalChain } = require('langchain/chains/retrieval');
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents');

const fs = require('fs');
const dotenv = require("dotenv");
// =================================================================
// Configurações
dotenv.config();
const llm = new ChatOpenAI({
  apiKey: process.env.CWG_LLM_OPENAI_KEY,
  modelName: process.env.CWG_LLM_OPENAI_MODEL ? process.env.CWG_LLM_OPENAI_MODEL : "gpt-4.1-nano",
});
const embeddings = new OpenAIEmbeddings({ 
  apiKey: process.env.CWG_LLM_OPENAI_KEY, 
  model: process.env.CWG_LLM_OPENAI_EMBEDDING ? process.env.CWG_LLM_OPENAI_EMBEDDING : "text-embedding-3-large"
});
const RAG_DIR = __dirname+'/rag-dir/';

// =================================================================
async function ask(question) {
    try {
        const response = await llm.invoke([new HumanMessage(question)]);
        return response.content;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
  }
}
// --------------------------
async function askFromPrompt(question, context = null) {
    try {
        const promptTemplate = ChatPromptTemplate.fromTemplate(`Para responder, utilize o conhecimento disponivel no contexto abaixo. 
                Caso não saiba responder, responda com 'Não tenho essa informação'

                Contexto: 
                {context}
                
                Pergunta: 
                {question}
        `);

        const chain = promptTemplate.pipe(llm);
        const response = await chain.invoke({ question, context });
        return response.content

  } catch (error) {
    console.error("Ocorreu um erro:", error);
  }
}
// --------------------------
async function saveEmbedding(URL = null, PDF = null, rag = 'default') {
    // --- ETAPA 1: CARREGAR O CONTEÚDO DO LINK ---
    // CARREGA DADOS DA URL OU PDF
    let loader;
    if (URL) loader = new CheerioWebBaseLoader(URL);
    else if (PDF) loader = new PDFLoader(PDF);

    const docs = await loader.load();

    // --- ETAPA 2: DIVIDIR O CONTEÚDO EM PEDAÇOS (CHUNKS) ---
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await textSplitter.splitDocuments(docs);

    // --- ETAPA 3: INDEXAR O CONTEÚDO (CRIAR VECTOR STORE) ---
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    vectorStore.save(RAG_DIR + rag)
}



async function askFromURL(question, URL = null, saveDir = false) {
    try {
        
        // --- ETAPA 1: CARREGAR O CONTEÚDO DO LINK ---
        // CARREGA DADOS DA URL
        const loader = new CheerioWebBaseLoader(URL);
        const docs = await loader.load();

        // --- ETAPA 2: DIVIDIR O CONTEÚDO EM PEDAÇOS (CHUNKS) ---
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const splitDocs = await textSplitter.splitDocuments(docs);

        // --- ETAPA 3: INDEXAR O CONTEÚDO (CRIAR VECTOR STORE) ---
        vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
        if (saveDir) vectorStore.save(RAG_DIR+saveDir)
        
        const retriever = vectorStore.asRetriever();

        // --- ETAPA 4: CRIAR A CHAIN PARA FAZER PERGUNTAS ---
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Responda à pergunta do usuário baseando-se exclusivamente no seguinte contexto extraído de uma página web.
            Se a informação não estiver no contexto, diga: Não tenho essa informação

            Contexto:
            {context}

            Pergunta:
            {input}
        `);
        
        // --- ETAPA 5: RECUPERANDO A INFORMAÇÃO
        const combineDocsChain = await createStuffDocumentsChain({ llm, prompt: promptTemplate });

        const retrievalChain = await createRetrievalChain({
            retriever,
            combineDocsChain
        });

        const response = await retrievalChain.invoke({
            input: question
        });

        return response.answer

  } catch (error) {
    console.error("Ocorreu um erro:", error);
  }
}
// ------------
async function askFromPDF(question, filePath = null, saveDir = false) {
    try {
        
        // --- ETAPA 1: CARREGAR O CONTEÚDO DO LINK ---
        // CARREGA DADOS DO PDF
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();

        // --- ETAPA 2: DIVIDIR O CONTEÚDO EM PEDAÇOS (CHUNKS) ---
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const splitDocs = await textSplitter.splitDocuments(docs);

        // --- ETAPA 3: INDEXAR O CONTEÚDO (CRIAR VECTOR STORE) ---
        const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
        if (saveDir) vectorStore.save(RAG_DIR+saveDir)
    
        const retriever = vectorStore.asRetriever();

        // --- ETAPA 4: CRIAR A CHAIN PARA FAZER PERGUNTAS ---
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Responda à pergunta do usuário baseando-se exclusivamente no seguinte contexto extraído de uma página web.
            Se a informação não estiver no contexto, diga: Não tenho essa informação

            Contexto:
            {context}

            Pergunta:
            {input}
        `);
        
        // --- ETAPA 5: RECUPERANDO A INFORMAÇÃO
        const combineDocsChain = await createStuffDocumentsChain({ llm, prompt: promptTemplate });

        const retrievalChain = await createRetrievalChain({
            retriever,
            combineDocsChain
        });

        const response = await retrievalChain.invoke({
            input: question
        });

        return response.answer

  } catch (error) {
    console.error("Ocorreu um erro:", error);
  }
}
// -------------------------------------------
async function askFromEmbedding(question, ragPath = 'default') {
    try {
        
        // --- ETAPA 1: CARREGAR O CONTEÚDO DO LINK ---
        // CARREGA DADOS DA RAG
        if (!fs.existsSync(RAG_DIR+ragPath))
            throw new Error('Diretório inválido')

        const vectorStore = await FaissStore.load(RAG_DIR+ragPath, embeddings);
        const retriever = vectorStore.asRetriever();

        // --- ETAPA 4: CRIAR A CHAIN PARA FAZER PERGUNTAS ---
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Responda à pergunta do usuário baseando-se exclusivamente no seguinte contexto extraído de uma página web.
            Se a informação não estiver no contexto, diga: Não tenho essa informação

            Contexto:
            {context}

            Pergunta:
            {input}
        `);
        
        // --- ETAPA 5: RECUPERANDO A INFORMAÇÃO
        const combineDocsChain = await createStuffDocumentsChain({ llm, prompt: promptTemplate });

        const retrievalChain = await createRetrievalChain({
            retriever,
            combineDocsChain
        });

        const response = await retrievalChain.invoke({
            input: question
        });

        return response.answer

  } catch (error) {
    console.error("Ocorreu um erro:", error);
  }
}

// -------------------
module.exports = { ask, askFromPrompt, askFromURL, askFromPDF, askFromEmbedding, saveEmbedding }