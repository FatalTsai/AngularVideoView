//https://blog.jscrambler.com/implementing-file-upload-using-node-and-angular/
//https://levelup.gitconnected.com/simple-application-with-angular-6-node-js-express-2873304fff0f
const  express  =  require('express')
const  app  =  express()
const  port  =  3000
const  multipart  =  require('connect-multiparty');
const  multipartMiddleware  =  multipart({ uploadDir:  './uploads' });
const { exec } = require('child_process');

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));



app.get('',(req,res) => {
    res.json
})

app.get('/api/upload', (req, res) => {
    res.json({
        'message': 'hello'
    });
});

app.post('/api/upload', multipartMiddleware, (req, res) => {
    res.json({
        'message': 'File uploaded successfully'
    });
});



app.listen(port, () => console.log(`Example app listening on port ${port}!`))