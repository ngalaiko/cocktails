export type Recipe = {
	title: string;
	slug: string;
	source: string;
	image?: string;
	ingredients: {
		title: string;
		amount?: number;
		unit?: string;
	}[];
	instruction: string;
	description?: string;
};
