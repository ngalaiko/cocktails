export type Recipe = {
	title: string;
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