import { list } from '$lib/recipes';
import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	const alternatives = list().filter((recipe) => recipe.slug === params.slug);
	if (alternatives.length === 0) throw error(404);
	throw redirect(302, new URL('0', url).toString());
};
