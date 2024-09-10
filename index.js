import puppeteer from 'puppeteer';
import fs from 'fs';

const getQuotes = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
    })

    // Open a new page
    const page = await browser.newPage();

    await page.goto("https://quotes.toscrape.com/",{
        waitUntil: 'domcontentloaded',
    });

    let quotes = [];
    let hasNextPage = true;

    const baseUrl = "https://quotes.toscrape.com"; // Base URL for relative paths

    //loop through all the pages
    while(hasNextPage){
        const pageQuotes = await page.evaluate(() => {
            const quoteList = document.querySelectorAll(".quote");

            return Array.from(quoteList).map((quote) => {
                const text = quote.querySelector(".text").innerText;
                const author = quote.querySelector(".author").innerText;
                
                const authorLink = quote.querySelector("a[href*='/author/']").getAttribute('href');

                const tags = Array.from(quote.querySelectorAll('.tags .tag')).map(tag => tag.innerText)
                
                return { text, author, authorLink, tags };
            })
        })
    
        // Now go to each author's page to get additional information
        for(let quote of pageQuotes){
            if (quote.authorLink) {
                try {
                    const authorUrl = `${baseUrl}${quote.authorLink}`;

                    await page.goto(authorUrl, { waitUntil: 'domcontentloaded' });
                    const authorDetails = await page.evaluate(() => {
                        const born = document.querySelector('.author-born-date')?.innerText || '';
                        const description = document.querySelector('.author-description')?.innerText || '';
                        return { born, description };
                    });
                    // Merge author details into the quote object
                    quote.born = authorDetails.born;
                    quote.description = authorDetails.description;
                } catch (error) {
                    console.error(`Failed to navigate to author page: ${quote.authorLink}`,error);
                }
            }
        }

        quotes = [...quotes, ...pageQuotes];

        // Check if the "Next" button exists
        const nextButton = await page.$('.pager > .next > a');

        if(nextButton){
            
            // Click on the "Next" button and wait for the page to load
            await Promise.all([
                page.click('.pager > .next > a'),
                page.waitForNavigation({ waitUntil: 'domcontentloaded' })
            ]);
        }
        else{
            hasNextPage = false;
        }
    }

    

    //categorize by authors
    const quotesByAuthor = quotes.reduce((acc,quote) => {
        if(!acc[quote.author]){
            acc[quote.author] = [];
        }
        acc[quote.author].push({
            text:quote.text,
            tags: quote.tags,
            born: quote.born,
            description: quote.description
        });
        return acc;
    }, {})
    
    //Categorize by tags
    const quotesByTag = quotes.reduce((acc,quote) => {
        quote.tags.forEach(tag => {
            if (!acc[tag]) {
                acc[tag] = [];
            }
            acc[tag].push({
                text: quote.text,
                author: quote.author,
                born: quote.born,
                description: quote.description
            });
        })
        return acc;
    },{})

    fs.writeFileSync('./quotes.json',JSON.stringify(quotes,null,2));
    // fs.writeFileSync('./quotes_by_author.json', JSON.stringify(quotesByAuthor, null, 2));
    // fs.writeFileSync('./quotes_by_tag.json', JSON.stringify(quotesByTag, null, 2));

    // console.log(quotes);

    // Click on the "Next page" button
    // await page.click('.pager > .next > a');
    
    await browser.close();
    
};

// getQuotes();
export {getQuotes};