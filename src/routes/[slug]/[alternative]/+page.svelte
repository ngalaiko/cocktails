<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="grid grid-cols-4 gap-4">
	<article class="col-span-3">
		<header>
			<div class="flex">
				<h1 class="font-bold text-2xl">{data.recipe.title}</h1>
				{#if data.alternatives.length > 1}
					{#each data.alternatives as alternative, i}
						<a class:font-semibold={data.index === i} href={alternative}><sup>[{i + 1}]</sup></a>
					{/each}
				{/if}
			</div>
		</header>

		<article class="grid grid-cols-2 gap-4">
			<ul class="rounded-l-none">
				{#each data.recipe.ingredients as ingredient}
					<li>
						{ingredient.title}
						{#if ingredient.amount}: {ingredient.amount} {ingredient.unit}{/if}
					</li>
				{/each}
			</ul>
			<p>
				{data.recipe.instruction}
			</p>
		</article>

		<footer>
			source:
			<a href={data.recipe.source}>{new URL(data.recipe.source).hostname}</a>
		</footer>
	</article>

	<aside>
		<ul class="flex flex-col gap-2">
			{#each data.neighbors as { diff, index, recipe }}
				<li>
					<span class="whitespace-nowrap"
						>to get <a class="underline" href="/{recipe.slug}/{index}/">{recipe.title}</a></span
					>:
					<ul>
						{#if diff.add.length > 0}
							<li>
								add: {diff.add.join(',')}
							</li>
						{/if}
						{#if diff.remove.length > 0}
							<li>
								remove: {diff.remove.join(',')}
							</li>
						{/if}
					</ul>
				</li>
			{/each}
		</ul>
	</aside>
</div>
