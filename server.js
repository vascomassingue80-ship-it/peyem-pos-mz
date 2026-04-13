const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// BANCO DE PRODUTOS - depois trocamos por arquivo JSON
const produtos = [
    { codigo: "6001234567890", nome: "Bourbon", preco: 10.00 },
    { codigo: "6000987654321", nome: "50-50 Biscuit", preco: 5.00 },
    { codigo: "7891000315507", nome: "Oreo", preco: 15.00 }
];

// Rota GET: buscar produto pelo código de barras
app.get('/produto/:codigo', (req, res) => {
    const produto = produtos.find(p => p.codigo === req.params.codigo);
    if (produto) {
        res.json(produto);
    } else {
        res.status(404).json({ erro: 'Produto não cadastrado' });
    }
});

app.listen(port, () => {
    console.log(`Peyem.POS rodando na porta ${port}`);
});