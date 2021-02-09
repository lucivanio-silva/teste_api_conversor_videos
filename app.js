const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fileConverter = require('./routes/file-converter')

//configurações
    //temos uma função para setar o cabeçalho HTTP padrão para as respostas 
    //que o nosso servidor retornará.
    app.use(function(req, res, next){
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.setHeader("Access-Control-Allow-Headers", "content-type");
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Credentials", true);
        next();
    });
    //body-parser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())





    //carregando rotas de conversão de videos por arquivos
    app.use('/file-converter', fileConverter)

//----------------------------------------------abrindo servidor--------------------------------------
//verifica em que ambente está rodando o processo e usa uma porta aleatória livre caso não exista usa a porta 8081
const PORT = process.env.PORT || 8081
app.listen(PORT,()=>{
    console.log('servidor rodando na porta: '+PORT)
})