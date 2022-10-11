import yargs from 'yargs';
import { parse } from 'node-html-parser';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import links from './links.js';

const argv = yargs(process.argv.slice(2))
    .option('output', {
        alias: 'o',
        default: './data',
        demandOption: true
    })
    .parseSync();

const downloadHtml = async (link: string) => {
    const filename = join(
        argv.output,
        '.cache',
        link.replace(/http(s)?:\/\//, '').replace(/\/$/, '') + '.html'
    );
    mkdirSync(dirname(filename), { recursive: true });
    try {
        return readFileSync(filename).toString();
    } catch (e: any) {
        if (e.code !== 'ENOENT') throw e;

        console.log(`downloading ${link}`);

        const content = await fetch(link, {
            method: 'GET',
            headers: {
                'User-Agent': "i'll be quick, thanks!"
            }
        }).then((response) => {
            if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
            return response.text();
        });

        writeFileSync(filename, content);

        return content;
    }
};

type Recipe = {
    title: string;
    source: string;
    image?: string;
    ingredients: {
        title: string;
        amount?: number;
        unit?: string;
    }[];
    instruction: string;
    description?: string;
};

const parseTuxedono = (link: string, html: string): Recipe => {
    const document = parse(html);
    const ingredientsLists = document.querySelectorAll('div.recipe__recipe > ul ');
    const ingredientsList = ingredientsLists.at(0);
    const ingredients = ingredientsList
        .querySelectorAll('li > span.ingredient')
        .map((a) => a.textContent.replace(/[\n  ]+/g, ' ').trim());
    const amounts = ingredientsList
        .querySelectorAll('li > span.amount ')
        .map((span) => span.firstChild?.text.trim())
        .map((amount) => {
            if (!amount) return undefined;

            let sum = 0;
            for (let p of amount) {
                const int = parseInt(p);
                if (!isNaN(int)) {
                    sum += int;
                } else if (p === '⅛') {
                    sum += 0.125;
                } else if (p === '⅓') {
                    sum += 0.33;
                } else if (p === '¼') {
                    sum += 0.25;
                } else if (p === '½') {
                    sum += 0.5;
                } else if (p === '¾') {
                    sum += 0.75;
                } else {
                    throw new Error(`idk what ${p} is`);
                }
            }
            return sum;
        });
    const units = ingredientsList
        .querySelectorAll('li > span.amount > span.unit ')
        .map((span) => span.text.trim());
    return {
        title: document.querySelector('h1.recipe__header-title > a > span').text.trim(),
        source: link,
        image: document.querySelector('img.recipe__primary-image').getAttribute('src'),
        ingredients: ingredients.map((ingredient, index) => ({
            title: ingredient
                .replace('dashes', '')
                .replace('dash', '')
                .replace(/(, )?for garnish/, '')
                .trim(),
            amount: amounts.at(index),
            unit: ingredient.includes('dashes') || ingredient.includes('dash') ? 'dash' : units.at(index)
        })),
        instruction: document
            .querySelector('div.recipe__recipe > ol')
            .querySelectorAll('li')
            .map((li) => li.text.trim())
            .join('\n'),
        description: document
            .querySelectorAll('div.recipe__description > div > p')
            .map((node) =>
                node.textContent.replace(/\n/g, '').replace(/ +/g, ' ').replace(' .', '.').trim()
            )
            .join('\n')
    };
};

const parseAwedomedrinks = (link: string, html: string): Recipe => {
    const document = parse(html);
    const title = document.querySelector('h1').text.trim()
    const instruction = document.querySelector('footer.blockquote-footer').parentNode.childNodes.slice(0, -2).map((node) =>
        node.textContent.replace(/\n/g, '').replace(/ +/g, ' ').replace(' .', '.').trim()
    )
        .filter(l => l)
        .join('\n')
    const image = new URL(document.querySelector('img').getAttribute('src').replace(/\.jpg.+/g, '.jpg'), new URL(link)).toString()
    const ingredients = document.querySelector('div.col.col-xl-7').childNodes.slice(2, -2).filter(n => n.nodeType === 1)
        .map(row => {
            const cols = row.childNodes.filter(n => n.nodeType === 1)
            if (cols.length === 2) {
                return { title: cols.at(1).text.trim() }
            }
            const amount = parseFloat(cols.at(0).text.trim())
            const title = cols.at(2).text.trim()
            const unit = cols.at(1).text?.trim()
            return {
                title,
                amount: amount > 0 ? amount : undefined,
                unit: unit.length > 0 ? unit : undefined
            }
        })
    return {
        title,
        instruction,
        image,
        source: link,
        ingredients
    };
};

const fetchSingle = async (link: string) => {
    const html = await downloadHtml(link);
    if (link.startsWith('https://tuxedono2.com')) {
        return parseTuxedono(link, html);
    } else if (link.startsWith('https://recipe.awesomedrinks.com')) {
        return parseAwedomedrinks(link, html);
    } else {
        throw new Error(`don't know how to fetch ${link}`);
    }
};

(async () => {
    const recipes = [];
    for (const link of links) {
        recipes.push(await fetchSingle(link));
    }
    const filename = join(argv.output, 'recipes.json');
    writeFileSync(filename, JSON.stringify(recipes, null, '  '));
    console.log(`${filename} written`);
})();
