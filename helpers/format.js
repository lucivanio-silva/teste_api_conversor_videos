module.exports = {
    format: (type) =>{
        const formats = ['video/mp4', 'video/m4v', 'video/mov', 'video/mpg', 'video/mpeg', 'video/avi', 'video/wmv', 'video/flv', 'video/webm', 'video/vob', 'video/evo', 'video/mts']
        if(formats.indexOf(type) < 0){
            return false
        }else{
            return true
        }
    }   
}