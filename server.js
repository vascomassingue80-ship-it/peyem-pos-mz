const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// "BANCO DE DADOS"
// =======================
let products = [
    { id: 1, name: 'Bourbon', price: 10.00, barcode: '6001234567890', stock: 50 },
    { id: 2, name: 'Água 500ml', price: 25.00, barcode: '6009876543210', stock: 100 },
    { id: 3, name: 'Sumo Compal', price: 45.00, barcode: '5601234567890', stock: 30 }
];

let sales = [];

let users = [
    { id: 1, username: 'vasco', password: '1234', name: 'Vasco Massingue' },
    { id: 2, username: 'caixa1', password: '0000', name: 'Funcionário 1' }
];

let sessions = {};

// =======================
// MIDDLEWARE DE LOG
// =======================
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// =======================
// AUTENTICAÇÃO
// =======================
function checkLogin(req, res, next) {
    const token = req.headers['authorization'];

    if (!token || !sessions[token]) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    req.user = sessions[token];
    next();
}

// =======================
// LOGIN
// =======================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Preencha usuário e senha' });
    }

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Token mais seguro
    const token = crypto.randomBytes(16).toString('hex');

    sessions[token] = {
        id: user.id,
        name: user.name
    };

    res.json({ token, name: user.name });
});

// =======================
// USUÁRIO LOGADO
// =======================
app.get('/api/me', checkLogin, (req, res) => {
    res.json({ name: req.user.name });
});

// =======================
// PRODUTOS
// =======================
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:barcode', (req, res) => {
    const product = products.find(p => p.barcode === req.params.barcode);

    if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(product);
});

// =======================
// VENDAS
// =======================
app.post('/api/sales', checkLogin, (req, res) => {
    const { items } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({ error: 'Carrinho vazio' });
    }

    let total = 0;

    // VALIDAR + CALCULAR
    for (const item of items) {
        const prod = products.find(p => p.id === item.id);

        if (!prod) {
            return res.status(400).json({ error: 'Produto inválido' });
        }

        if (prod.stock < item.qtd) {
            return res.status(400).json({ error: `Sem estoque para ${prod.name}` });
        }

        total += prod.price * item.qtd;
    }

    // ATUALIZAR ESTOQUE
    items.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        prod.stock -= item.qtd;
    });

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

// =======================
// RELATÓRIO
// =======================
app.get('/api/sales/today', checkLogin, (req, res) => {
    const hoje = new Date().toDateString();

    const vendasHoje = sales.filter(s =>
        new Date(s.date).toDateString() === hoje
    );

    const totalDia = vendasHoje.reduce((soma, v) => soma + v.total, 0);

    res.json({
        vendas: vendasHoje,
        totalDia,
        qtdVendas: vendasHoje.length
    });
});

// =======================
// LOGOUT (MELHORADO)
// =======================
app.post('/api/logout', checkLogin, (req, res) => {
    const token = req.headers['authorization'];
    delete sessions[token];
    res.json({ msg: 'Logout feito' });
});

// =======================
// ROTA FRONTEND
// =======================
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// =======================
// START
// =======================
app.listen(PORT, () => {
    console.log(`🔥 Peyem.POS rodando em http://localhost:${PORT}`);
});