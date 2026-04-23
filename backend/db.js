const mysql = require('mysql2');

const connection = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: '',
   database: 'denuncia_urbana_novo',
   port: 3306
});

connection.connect((err) => {
   if (err) {
      console.error('❌ Erro ao conectar:', err);
      return;
   }
   console.log('✅ Conectado ao MySQL com sucesso!');
});

module.exports = connection;