//const { ask, askFromPrompt, askFromURL, askFromPDF, askFromEmbedding, saveEmbedding } = require('../openai');
const { ask, askFromPrompt, askFromURL, askFromPDF, askFromEmbedding, saveEmbedding } = require('cwg-llm-openai');

async function main() {
    //const resposta = await ask('Quem é Carlos W. Gama?');
    //const resposta = await askFromPrompt('Quem é Carlos W. Gama?', 'Carlos W. Gama é um professor do cesmac');
    //const resposta = await askFromURL('Quem é Carlos W. Gama?', 'https://carloswgama.com.br', 'web');
    //const resposta = await askFromPDF('Quem é Carlos W. Gama?', './src/example/doc.pdf', 'pdf');
    //await saveEmbedding('https://carloswgama.com.br', 'fonte_url');
    const resposta = await askFromEmbedding('Quem é Carlos W. Gama?', 'fonte_url');
    console.log(resposta);
}

main();