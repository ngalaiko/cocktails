import { list } from '$lib/recipes';
import type { PageLoad } from './$types';

export let load: PageLoad = () => ({
    recipes: list().sort((a, b) => a.title.localeCompare(b.title))
});
