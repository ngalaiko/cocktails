import type { Recipe } from './types';
import data from './data.json';

export const list = (): Recipe[] => data;
