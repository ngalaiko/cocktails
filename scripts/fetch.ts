import yargs from 'yargs';
import { parse } from 'node-html-parser';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import slugifyLib from 'slugify';

import links from './links.js';
import type { Recipe } from '../src/lib/recipes/types.js';

const slugify = (s: string) => {
    if (s === 'Air Mail') {
        s = 'Airmail';
    }
    return slugifyLib(s, {
        lower: true,
        strict: true,
        trim: true
    });
};

const pwd = dirname(process.argv[1]);

const argv = yargs(process.argv.slice(2))
    .option('output', {
        alias: 'o',
        type: 'string',
        demandOption: true
    })
    .parseSync();

const downloadHtml = async (link: string) => {
    const filename = join(
        pwd,
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
                'User-Agent': "i'll be quick, thanks!",
                Cookie: 'diffords_webapp=5ce5pn11jgk1o69v9rs6ca0m5q;'
            }
        }).then((response) => {
            if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
            return response.text();
        });

        writeFileSync(filename, content);

        return content;
    }
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
            for (const p of amount) {
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
    const title = document.querySelector('h1.recipe__header-title > a > span').text.trim();
    return {
        title,
        slug: slugify(title),
        source: link,
        ingredients: ingredients.map((ingredient, index) => ({
            title: ingredient
                .replace('dashes', '')
                .replace('dash', '')
                .replace(/\(?optional\)?/, '')
                .replace(/(, )?(for )?garnish/, '')
                .replace(/(, )?to fill/, '')
                .replace(/fill( with)?/, '')
                .replace(/(, )?for muddling/, '')
                .replace(/passionfruit/, 'passion fruit')
                .trim()
                .replace(/,$/, '')
                .replace(/\.$/, ''),
            amount: amounts.at(index),
            unit: ingredient.includes('dashes') || ingredient.includes('dash') ? 'dash' : units.at(index)
        })),
        instruction: document
            .querySelector('div.recipe__recipe > ol')
            .querySelectorAll('li')
            .map((li) => li.text.trim())
            .join('\n')
    };
};

const parseAwedomedrinks = (link: string, html: string): Recipe => {
    const document = parse(html);
    const title = document.querySelector('h1').text.trim();

    const instruction = document
        .querySelector('footer.blockquote-footer')
        .parentNode.childNodes.slice(0, -2)
        .map((node) =>
            node.textContent.replace(/\n/g, '').replace(/ +/g, ' ').replace(' .', '.').trim()
        )
        .filter((l) => l)
        .join('\n');
    const ingredients = document
        .querySelector('div.col.col-xl-7')
        .childNodes.slice(2, -2)
        .filter((n) => n.nodeType === 1)
        .map((row) => {
            const cols = row.childNodes.filter((n) => n.nodeType === 1);
            if (cols.length === 2) {
                return { title: cols.at(1).text.trim() };
            }
            const amount = parseFloat(cols.at(0).text.trim());
            const title = cols
                .at(2)
                .text.trim()
                .replace(/, Quartered/, '');
            const unit = cols.at(1).text?.trim();
            return {
                title,
                amount: amount > 0 ? amount : undefined,
                unit: unit.length > 0 ? unit : undefined
            };
        });
    return {
        title,
        slug: slugify(title),
        instruction,
        source: link,
        ingredients
    };
};

const parseDiffordsguide = (link: string, html: string) => {
    const document = parse(html);
    const title = document.querySelector('h1').text.trim();
    const instruction = document.querySelectorAll('h2').find((h2) => h2.text === 'How to make:')
        ?.nextElementSibling.textContent;
    const garnish = document.querySelectorAll('h3').find((h2) => h2.text === 'Garnish:')
        ?.nextElementSibling.textContent;
    const ingredientRows = document
        .querySelectorAll('table.ingredients-table > tbody > tr > td')
        .slice(0, -1)
        .map((td) => td.textContent.trim());

    const ingredientTitles = ingredientRows.filter((_, i) => i % 2 !== 0);

    const ingredientAmounts = ingredientRows
        .filter((_, i) => i % 2 === 0)
        .map((measure) => /(⁄|\d)+/.exec(measure)?.[0])
        .map((measure) => measure?.replace('⁄', '/'));

    const ingredientUnits = ingredientRows
        .filter((_, i) => i % 2 === 0)
        .map((measure) => /(dash|shot)+/.exec(measure)?.[0])
        .map((measure) => measure?.replace('⁄', '/'));

    const image = document
        .querySelectorAll('img')
        .find((img) => img.getAttribute('alt') === 'Product image')
        ?.getAttribute('src');

    const ingredients = ingredientTitles.map((title, index) => ({
        title: title
            .replace(/\(.+\)/, '')
            .replace(/ +/, ' ')
            .trim(),
        amount: ingredientAmounts.at(index),
        unit: ingredientUnits.at(index)
    }));

    if (garnish) {
        ingredients.concat({ title: garnish, amount: undefined, unit: undefined });
    }

    return {
        title,
        source: link,
        slug: slugify(title),
        image,
        instruction,
        ingredients
    };
};

const fetchSingle = async (link: string) => {
    const html = await downloadHtml(link);
    if (link.startsWith('https://tuxedono2.com')) {
        return parseTuxedono(link, html);
    } else if (link.startsWith('https://recipe.awesomedrinks.com')) {
        return parseAwedomedrinks(link, html);
    } else if (link.startsWith('https://www.diffordsguide.com')) {
        return parseDiffordsguide(link, html);
    } else {
        throw new Error(`don't know how to fetch ${link}`);
    }
};

(async () => {
    const recipes = [];
    for (const link of links) {
        const recipe = await fetchSingle(link);

        // ignore diffordsguide recipies with so called special ingredients
        if (recipe.ingredients.some(({ title }) => title.includes('(see above)'))) continue;

        recipes.push(recipe);
    }
    writeFileSync(argv.output, JSON.stringify(recipes, null, '  '));
    console.log(`${argv.output} written`);
})();
