import express from "express";
import bodyParser from "body-parser";
import {MongoClient} from 'mongodb';
import path from 'path';


const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());


const WithDB = async (operation, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
        const db = client.db('my-blog');
        await operation(db);
        client.close();
    } catch (error) {
        res.status(500).json({message: 'Error conecting to db', error});
    }
    
}

app.get('/api/articles/:name', async (req, res) => {

        WithDB( async (db) => {
            const articleName = req.params.name;
            const articleInfo = await db.collection('articles').findOne({name: articleName});
            res.status(200).json(articleInfo);
        })
    
})


app.post('/api/articles/:name/upvotes', async (req, res)=>{

    WithDB ( async (db)=> {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {$set: {upvotes: articleInfo.upvotes + 1}});
        const updatedInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedInfo);

    }, res)
    
});
app.post('/api/articles/:name/add-comments', async (req, res)=> {

    WithDB( async (db) => {

        const {username, text} = req.body;
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name : articleName}, {
            $set: {
                comments: articleInfo.comments.concat({username, text}),
            }
        })
       const updatedInfo = await db.collection('articles').findOne({name: articleName});
       res.status(200).json(updatedInfo);
    }, res)
   
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})


app.listen(8000, ()=> console.log("app is listening at port 8000"));