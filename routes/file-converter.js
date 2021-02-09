const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const SHA256 = require('crypto-js/sha256')
const rimraf = require('rimraf')
//guardar dados no navegador
const localStorage = require('web-storage')().localStorage
//gerenciador de uploads
const multer = require('multer')

//conversor de videos
const hbjs = require('handbrake-js')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
//verificador de formatos de video
const {format} = require('../helpers/format')
let fileName = ''
let fileID = 'null'
let percent = []
//caminho onde são salvas as conversões para download
//let dir = ''

//formatos de vídeo suportados
const formats =[{ext:'mp4', name:'MP4'}, {ext:'m4v', name: 'M4V'}, {ext:'mov', name: 'MOV'},
    {ext:'mpg', name: 'MPG'}, {ext:'mpeg',name:'MPEG'}, {ext:'avi',name:'AVI'},
    {ext:'wmv',name:'WMV'}, {ext:'flv',name:'FLV'}, {ext:'webm',name: 'WEBM'}, 
    {ext:'vob', name:'VOB'}, {ext:'evo',name:'EVO'}, {ext:'mts', name:'MTS'}, 
    {ext:'mp3', name: 'MP3'}, {ext: 'ac3', name:'AC3'}, {ext:'aac', name: 'AAC'}, {ext: 'wav', name: 'WAV'}]


//rota principal
router.get('/', (req, res)=>{
    res.json({msg:'olá'})
})

//processo de upload
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'temp/')
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    }

})

const upload = multer({storage})

router.post('/start', upload.single('file'), (req, res)=>{
    //pegando tamanho do arquivo na página de escolha do vídeo
    res.send('upload concluído: '+fileName)
})

router.post('/convert-video/:name/:format', (req, res)=>{
    let name = req.params.name
    let format = req.params.format
    let folderName = createFolder(name)
    convertVideo(name, format, folderName)
    res.json({name: name, format: format, folderName: folderName})
})

router.post('/convert-audio/:name/:format',(req,res)=>{
    let name = req.params.name
    let format = req.params.format
    let folderName = createFolder(name)
    convertAudio(name, format, folderName)
    res.json({name: name, format: format, folderName: folderName})
})

//rota para retornar o percentual do processamento cocluido
router.get('/convert/percent_complete/:id',(req, res)=>{
        res.send(localStorage.get(req.params.id))
})

//rota para fazer o download do arquivo convertido
router.get('/convert/download/:path/:format',(req, res)=>{
    let dir = 'temp/'+req.params.path+'/converted-file.'+req.params.format
    res.download(dir, (error)=>{
        if(error){
            res.send('arquivo não existe')
        }
    })
})


router.get('/convert/delete/:id', (req, res)=>{
    var diretorio = 'temp/'+req.params.id
    deleteDir(diretorio)
    res.send(diretorio)
})

//função para converter vídeos
function convertVideo(name, extension, folderName){
    //verifica se formato é valido
    try{
        let fileConvertedName = `/converted-file.${extension}`
        let dir = `temp/${folderName}`

        const options = {
            input: 'temp/'+name,
            output: dir+fileConvertedName,
            preset: 'Very Fast 480p30',
        }
        hbjs.spawn(options)
        .on('error', (error)=>{
            console.log('erro: '+error)

        })
        .on('progress', progress =>{
            console.log('Percent complete:'+progress.percentComplete)
            //cria uma variavel no local storage para essa execução
            localStorage.set(folderName, progress.percentComplete+"")
        })
        .on('end', ()=>{
            fs.unlink(`temp/${name}`, (erro)=>{
                if(erro) console.log('erro ao excluir arquivo: '+ erro)
            })
            
        })           
    }catch(erro){
        fs.unlink(`temp/${name}`, (erro)=>{
            if(erro) console.log('erro ao excluir arquivo: '+ erro)
        })
        console.log('erro ao converter o video: '+erro)
    }
}

function convertAudio(name, extension, folderName){
    let fileConvertedName = `/converted-file.${extension}`
    let dir = `temp/${folderName}`
    var path = require('path');
    var input = path.resolve(`temp/${name}`);
    var output = path.resolve(dir+fileConvertedName);
    let percentComplete = 0

    var process = ffmpeg(input)
    .toFormat(extension)
    .on('progress', function(progress){
        if(percentComplete < 85)
            percentComplete += 1
            localStorage.set(folderName, percentComplete+"")
    })
    .on('end', function() {
        console.log('file has been converted succesfully');
        localStorage.set(folderName, "100")
        fs.unlink(`temp/${name}`, (erro)=>{
            if(erro) console.log('erro ao excluir arquivo: '+ erro)
        })
      })
    .on('error', function(err) {
        console.log('an error happened: ' + err.message);
        fs.unlink(`temp/${name}`, (erro)=>{
            if(erro) console.log('erro ao excluir arquivo: '+ erro)
        })
      })
      // save to file
    .save(output);
}

//função para criar diretórios
function createFolder(fileName) {
    var data = new Date()
    let folder = SHA256(fileName+data.getTime())
    let folderName = folder.toString()
    let dir = `temp/${folder}`
    //Verifica se não existe
    if (!fs.existsSync(dir)){
        //Efetua a criação do diretório
        fs.mkdirSync(dir);
        return folderName
    }

}

//função para excluir diretórios
function deleteDir(dir){
   if( fs.existsSync(dir) ) {
    fs.readdirSync(dir).forEach(function(file) {
      var curPath = dir + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(dir);
  }
}


module.exports = router
