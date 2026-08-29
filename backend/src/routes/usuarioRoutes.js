const express = require('express');
const router = express.Router();
router.post('/',(req, res) => {
    res.json({
        mensagem: 'Rota de usuario funcionando!'
    });
});
module.exports = router;