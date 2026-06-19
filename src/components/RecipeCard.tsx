import React, { MouseEvent } from "react";
import { motion, useAnimation } from "motion/react";
import { Clock, Flame, Heart, ChevronRight } from "lucide-react";
import { Recipe } from "../types";

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails: (recipe: Recipe) => void;
  onToggleFavorite: (id: string, e?: MouseEvent) => void;
}

export default function RecipeCard({ recipe, onViewDetails, onToggleFavorite }: RecipeCardProps) {
  const controls = useAnimation();
  
  // Determine difficulty color badges
  const difficultyColors = {
    ușor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50",
    mediu: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50",
    dificil: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800/50"
  };

  const handleDragEnd = async (_event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold || info.offset.x < -threshold) {
      onToggleFavorite(recipe.id);
    }
  };

  return (
    <motion.div 
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 20 }
      }}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden bg-rose-50 dark:bg-rose-950/20"
    >
      {/* Background layer shown when swiping */}
      <div className="absolute inset-0 flex items-center justify-between px-8 opacity-60 pointer-events-none">
        <Heart className={`h-8 w-8 ${recipe.isFavorite ? "fill-rose-500 text-rose-500" : "text-rose-400"}`} />
        <Heart className={`h-8 w-8 ${recipe.isFavorite ? "fill-rose-500 text-rose-500" : "text-rose-400"}`} />
      </div>

      <motion.div
        whileHover={{ y: -6, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs transition-shadow duration-500 hover:shadow-2xl hover:shadow-stone-300/40 dark:hover:shadow-stone-950/80 cursor-pointer w-full h-full"
        onClick={() => onViewDetails(recipe)}
        id={`recipe-card-${recipe.id}`}
      >
        {/* Recipe image container */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 dark:bg-stone-800 pointer-events-none">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-stone-300 dark:text-stone-700">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Soft dark gradient overlay for lower text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Favorite button (absolute top right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(recipe.id, e);
          }}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md shadow-xs text-stone-500 dark:text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-stone-800 active:scale-90 transition-all duration-200 z-10"
          title={recipe.isFavorite ? "Elimină de la favorite" : "Adaugă la favorite"}
          id={`fav-btn-${recipe.id}`}
        >
          <Heart
            className={`h-4 w-4 transition-transform duration-300 ${recipe.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""}`}
          />
        </button>

        {/* Category Badge (absolute top left) */}
        <span className="absolute top-4 left-4 rounded-full bg-stone-900/60 dark:bg-black/60 backdrop-blur-md px-3 py-1 font-medium text-white tracking-wide uppercase text-[10px] shadow-sm z-10">
          {recipe.category}
        </span>

        {/* Card body content */}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-2 mb-3">
            {/* Difficulty */}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase ${difficultyColors[recipe.difficulty]}`}>
              {recipe.difficulty}
            </span>

            {/* Cooking time summary */}
            <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
              <Clock className="h-3 w-3" />
              {recipe.prepTime + recipe.cookTime} min
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {recipe.calories && (
                <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                  <Flame className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  {recipe.calories} kcal
                </span>
              )}
            </div>
          </div>

          {/* Recipe Title */}
          <h3 className="text-lg font-semibold font-display text-stone-900 dark:text-stone-100 tracking-tight leading-snug grow group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors duration-200">
            {recipe.title}
          </h3>

          {/* Short description */}
          <p className="mt-2 line-clamp-2 text-stone-500 dark:text-stone-400 text-xs leading-relaxed">
            {recipe.description}
          </p>

          {/* Footer actions */}
          <div className="mt-4 pt-4 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between text-xs font-medium text-stone-900 dark:text-stone-300">
            <span className="text-stone-400 dark:text-stone-500 font-normal">
              {recipe.servings} {recipe.servings === 1 ? "porție" : "porții"}
            </span>
            <span className="flex items-center gap-1 text-stone-900 dark:text-stone-200 group-hover:text-amber-950 dark:group-hover:text-amber-300 font-medium transition-colors">
              Vezi Rețeta
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
