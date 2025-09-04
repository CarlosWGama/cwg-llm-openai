const express = require('express')
const { ask, askFromPrompt, askFromURL, askFromPDF, askFromEmbedding } = require('./src/openai');

const app = express();
app.use(express.json());


//USO DA API SIMPLES
app.get('/api/simples', async (req, res) => {

    const pergunta = req.body.pergunta
    if (!pergunta) return res.status(400).json({erro: 'Faltando pergunta'})
    
    console.log('Mensagem', req.body.pergunta);
    const resposta = await ask(pergunta);
    // Envia uma resposta de sucesso de volta
    res.status(201).json({ resposta });
});

//USO DA API PASSANDO CONTEXTO
app.get('/api/context', async (req, res) => {

    const pergunta = req.body.pergunta
    if (!pergunta) return res.status(400).json({erro: 'Faltando pergunta'})

    console.log('Mensagem', req.body.pergunta);
    const resposta = await askFromPrompt(pergunta, 'Carlos W. Gama é quem criou esse projeto!');
    // Envia uma resposta de sucesso de volta
    res.status(201).json({ resposta });
});


//USO DA API USANDO RAG COM URL
app.get('/api/url', async (req, res) => {

    const pergunta = req.body.pergunta
    if (!pergunta) return res.status(400).json({erro: 'Faltando pergunta'})

    console.log('Mensagem', req.body.pergunta);
    const resposta = await askFromURL(pergunta, 'https://carloswgama.com.br');
    // Envia uma resposta de sucesso de volta
    res.status(201).json({ resposta });
});


//USO DA API USANDO PDF
app.get('/api/pdf', async (req, res) => {

    const pergunta = req.body.pergunta
    if (!pergunta) return res.status(400).json({erro: 'Faltando pergunta'})
        
    console.log('Mensagem', req.body.pergunta);
    const resposta = await askFromPDF(pergunta, './src/example/doc.pdf', 'caminho_embedding');
    // Envia uma resposta de sucesso de volta
    res.status(201).json({ resposta });
});

//USO DA API USANDO EMBEDDING
app.get('/api/embedding', async (req, res) => {

    const pergunta = req.body.pergunta
    if (!pergunta) return res.status(400).json({erro: 'Faltando pergunta'})

    console.log('Mensagem', req.body.pergunta);
    const resposta = await askFromEmbedding(pergunta, 'caminho_embedding');
    // Envia uma resposta de sucesso de volta
    res.status(201).json({ resposta });
});


app.listen(3000, () => console.log('Servidor Rodando'))