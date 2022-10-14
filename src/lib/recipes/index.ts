export * from './types';

import type { Recipe } from './types';

import recipesJSON from './data/recipes.json';
import begetsJSON from './data/begets.json';
import { version } from 'yargs';

const recipes = recipesJSON as Recipe[];
const begets = begetsJSON as [string, string][];

export const list = (): Recipe[] =>
    recipes.map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients.map((ingredient) => {
            if (ingredient.title === undefined) console.log(recipe);
            return {
                ...ingredient,
                title: ingredient.title.toLocaleLowerCase()
            };
        })
    }));

const directBegets = (ingredient: string) =>
    begets.filter((beget) => beget[0] === ingredient).map((beget) => beget[1]);

const transactiveBegets = (ingredient: string): string[] => {
    const direct = directBegets(ingredient);
    return [...direct, ...direct.filter((i) => !direct.includes(i)).flatMap(transactiveBegets)];
};

const isBegets = (ingredient: string, anotherIngredient: string) =>
    ingredient === anotherIngredient ||
    directBegets(ingredient).includes(anotherIngredient) ||
    transactiveBegets(ingredient).includes(anotherIngredient);

export const difference = (_this: Recipe, that: Recipe) => {
    const thisIngredients = _this.ingredients.map((ingredient) => ingredient.title);
    const thatIngredients = that.ingredients.map((ingredient) => ingredient.title);
    return {
        add: thatIngredients.filter(
            (thatIngredient) =>
                !thisIngredients.some((thisIngredient) => isBegets(thisIngredient, thatIngredient))
        ),
        remove: thisIngredients.filter(
            (thisIngredient) =>
                !thatIngredients.some((thatIngredient) => isBegets(thisIngredient, thatIngredient))
        )
    };
};

// const allIngredients = list()
//     .flatMap(({ ingredients }) => ingredients.map(({ title }) => title))
//     .sort((a, b) => a.localeCompare(b))
//     .filter((v, i, s) => s.indexOf(v) === i);

// allIngredients.forEach((i) => console.log(i));
// console.log(allIngredients.length);

// const dist: Record<number, number> = {};

// list().forEach((selectedRecipe, i, all) => {
//     console.log((i / all.length) * 100);
//     const index = all.slice(0, i).filter(({ slug }) => slug === selectedRecipe.slug).length;
//     const neighbors = all
//         .map((recipe, index, all) => ({
//             diff: difference(selectedRecipe, recipe),
//             index: all.slice(0, index).filter(({ slug }) => slug === recipe.slug).length,
//             recipe
//         }))
//         .filter(
//             ({ diff, recipe }) =>
//                 diff.add.length + diff.remove.length <=
//                 (selectedRecipe.ingredients.length + recipe.ingredients.length) / 2
//         )
//         .filter((neighbor) => neighbor.recipe.slug !== selectedRecipe.slug || neighbor.index !== index);

//     dist[neighbors.length] = dist[neighbors.length] ?? 0 + 1;
// });

// console.log({
//     dist,
//     distRelative: Object.fromEntries(
//         Object.entries(dist).map(([a, dist]) => [a, dist / list().length])
//     )
// });
