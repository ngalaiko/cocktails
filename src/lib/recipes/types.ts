export type Recipe = {
	title: string;
	slug: string;
	source: string;
	ingredients: {
		title: string;
		amount?: number;
		unit?: string;
	}[];
	instruction: string;
};
