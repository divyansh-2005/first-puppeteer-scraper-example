import {getQuotes} from './index.js'
import express from 'express';
import fs from 'fs';
const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', async (req, res) => {
    await getQuotes();
    const data = fs.readFileSync('./quotes.json', 'utf-8');
    const quotes = JSON.parse(data);

    res.render('quotes', { quotes });
})

app.get('/quotes-by-tag',(req,res) => {
    
     // Read the quotes data from the JSON file
     const data = fs.readFileSync('./quotes.json', 'utf-8');
     const quotes = JSON.parse(data);
 
     // Categorize quotes by tags
     const quotesByTag = quotes.reduce((acc, quote) => {
         quote.tags.forEach(tag => {
             if (!acc[tag]) {
                 acc[tag] = [];
             }
             acc[tag].push(quote);
         });
         return acc;
     }, {});

    res.render('quotes-by-tag', { quotesByTag });
})

app.get('/quotes-by-author',(req,res) => {
    
    // Read the quotes data from the JSON file
    const data = fs.readFileSync('./quotes.json', 'utf-8');
    const quotes = JSON.parse(data);

    // Categorize quotes by authors
    const quotesByAuthor = quotes.reduce((acc, quote) => {
        if (!acc[quote.author]) {
            acc[quote.author] = [];
        }
        acc[quote.author].push(quote);
        return acc;
    }, {});

    res.render('quotes-by-author', { quotesByAuthor });
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
})