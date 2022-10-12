module.exports = {
	content: ['./src/**/*.{html,svelte,ts}'],
	mode: 'jit',
	theme: {},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/aspect-ratio'),
		require('@tailwindcss/line-clamp')
	]
};
