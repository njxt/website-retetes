export type RecipeDifficulty = "ușor" | "mediu" | "dificil";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: RecipeDifficulty;
  ingredients: string[];
  instructions: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isFavorite?: boolean;
  createdAt: string;
}

export type Category = "Toate" | "Mic Dejun" | "Prânz" | "Cină" | "Desert" | "Gustări";
