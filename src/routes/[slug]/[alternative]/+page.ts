import { difference, list } from '$lib/recipes';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	const alternatives = list().filter((recipe) => recipe.slug === params.slug);
	if (alternatives.length === 0) throw error(404);
	const index = parseInt(params.alternative);
	if (index >= alternatives.length) throw error(404);
	const selectedRecipe = alternatives.at(index);
	return {
		recipe: selectedRecipe,
		index,
		alternatives: Array.from({ length: alternatives.length }, (_, index) => index).map((a) =>
			new URL(`../${a}`, url).toString()
		),
		neighbors: list()
			.map((recipe, index, all) => ({
				diff: difference(selectedRecipe, recipe),
				index: all.slice(0, index).filter(({ slug }) => slug === recipe.slug).length,
				recipe
			}))
			.filter(
				({ diff, recipe }) =>
					diff.add.length + diff.remove.length <=
					(selectedRecipe.ingredients.length + recipe.ingredients.length) / 2
			)
			.filter(
				(neighbor) => neighbor.recipe.slug !== selectedRecipe.slug || neighbor.index !== index
			)
	};
};
