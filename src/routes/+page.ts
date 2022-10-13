import { list } from '$lib/recipes';
import type { PageLoad } from './$types';

export const load: PageLoad = () => ({
	recipes: list().sort((a, b) => a.title.localeCompare(b.title))
});
