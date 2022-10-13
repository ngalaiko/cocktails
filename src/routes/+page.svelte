<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<ul>
	{#each data.recipes.filter((recipe, index, all) => all.findIndex((r) => r.slug === recipe.slug) === index) as recipe}
		<li>
			<a href={recipe.slug}>{recipe.title}</a>
		</li>
	{/each}
</ul>
