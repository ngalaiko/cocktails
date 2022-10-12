import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: [
		preprocess({
			postcss: true,
			typescript: true
		})
	],
	kit: {
		adapter: adapter(),
		prerender: {
			enabled: true,
			crawl: true
		},
		trailingSlash: 'always'
	}
};

export default config;
