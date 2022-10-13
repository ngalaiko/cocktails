export * from './types';

import type { Recipe } from './types';

import recipesJSON from './data/recipes.json';
import begetsJSON from './data/begets.json';

const recipes = recipesJSON as Recipe[];
const begets = begetsJSON as [string, string][];

export const list = (): Recipe[] =>
	recipes.map((recipe) => ({
		...recipe,
		ingredients: recipe.ingredients.map((ingredient) => ({
			...ingredient,
			title: ingredient.title.toLocaleLowerCase()
		}))
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
