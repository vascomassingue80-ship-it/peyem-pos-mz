const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// BANCO DE DADOS FAKE
let products = [
    { id: 1, name: 'Bourbon', price: 10.00, barcode: '6001234567890', stock: 50 },
    { id: 2, name: 'Água 500ml', price: 25.00, barcode: '6009876543210', stock: 100 },
    { id: 3, name: 'Sumo Compal', price: 45.00, barcode: '5601234567890', stock: 30 }
];

let sales = []; // Guarda todas as vendas
let users = [
    { id: 1, username: 'vasco', password: '1234', name: 'Vasco Massingue' },
    { id: 2, username: 'caixa1', password: '0000', name: 'Funcionário 1' }
];
let sessions = {}; // Guarda quem tá logado

// MIDDLEWARE DE LOGIN
function checkLogin(req, res, next) {
    const token = req.headers['authorization'];
    if (token && sessions[token]) {
        req.user = sessions[token];
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado. Faça login.' });
    }
}

// ROTAS DE LOGIN - FUNCIONALIDADE 4
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = 'token_' + Math.random().toString(36).substring(2);
        sessions[token] = user;
        res.json({ token, name: user.name });
    } else {
        res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
});

app.get('/api/me', checkLogin, (req, res) => {
    res.json({ name: req.user.name });
});

// ROTAS DE PRODUTOS
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:barcode', (req, res) => {
    const product = products.find(p => p.barcode === req.params.barcode);
    if (product) res.json(product);
    else res.status(404).json({ error: 'Produto não encontrado' });
});



// ROTA DE VENDA - ATUALIZA ESTOQUE - FUNCIONALIDADE 3
app.post('/api/sales', checkLogin, (req, res) => {
    const { items, total } = req.body;

    // 1. Baixa estoque
    for (const item of items) {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            if (prod.stock < item.qtd) {
                return res.status(400).json({ error: `Estoque insuficiente para ${prod.name}` });
            }
            prod.stock -= item.qtd;
        }
    }

    // 2. Salva venda
    const sale = {
        id: sales.length + 1,
        items,
        total,
        date: new Date(),
        user: req.user.name
    };
    sales.push(sale);
    res.status(201).json(sale);
});

// ROTA BUSCAR VENDAS DO DIA - FUNCIONALIDADE 2
app.get('/api/sales/today', checkLogin, (req, res) => {
    const hoje = new Date().toDateString();
    const vendasHoje = sales.filter(s => new Date(s.date).toDateString() === hoje);
    const totalDia = vendasHoje.reduce((soma, v) => soma + v.total, 0);
    res.json({ vendas: vendasHoje, totalDia, qtdVendas: vendasHoje.length });
});

// ROTA PADRÃO
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(Servidor Peyem.POS rodando na porta ${PORT}));