import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Users, Flame, Check, Heart, X, Info, Printer } from "lucide-react";
import { Recipe } from "../types";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function RecipeDetail({ recipe, onBack, onToggleFavorite }: RecipeDetailProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [currentServings, setCurrentServings] = useState<number>(recipe.servings);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Safe multiplier for ingredients listing if scaling is needed
  const scalingFactor = currentServings / recipe.servings;

  // Simple formula to parse leading numbers in Romanian recipe ingredients
  // e.g. "4 ouă", "120g guanciale", "1.5 lingurițe", "1/2 cană"
  const scaleIngredientText = (text: string): string => {
    if (scalingFactor === 1) return text;

    // Matches numbers at start: integer, decimal (using . or ,) or fractions (like 1/2)
    const fractionRegex = /^(\d+)\/(\d+)\s*(.*)/;
    const decimalRegex = /^(\d+[,.]\d+|\d+)\s*(g|ml|l|kg|lingurițe|lingură|linguri|căței|cană|căni|felii|pachete|bucăți|gălbenușuri|ouă)?\s*(.*)/i;

    const fractionMatch = text.match(fractionRegex);
    if (fractionMatch) {
      const num = parseInt(fractionMatch[1], 10);
      const den = parseInt(fractionMatch[2], 10);
      const scaledVal = (num / den) * scalingFactor;
      const formattedVal = scaledVal % 1 === 0 ? scaledVal.toString() : scaledVal.toFixed(1);
      return `${formattedVal} ${fractionMatch[3]}`;
    }

    const decimalMatch = text.match(decimalRegex);
    if (decimalMatch) {
      const numStr = decimalMatch[1].replace(",", ".");
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        const scaledVal = num * scalingFactor;
        // Format to nicely rounded numbers
        const formattedVal = scaledVal % 1 === 0 
          ? scaledVal.toString() 
          : scaledVal.toFixed(scaledVal * 10 % 10 === 0 ? 0 : 1);
        
        const unit = decimalMatch[2] ? decimalMatch[2] : "";
        const rest = decimalMatch[3] ? decimalMatch[3] : "";
        return `${formattedVal}${unit ? " " + unit : ""} ${rest}`;
      }
    }

    return text;
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 print:py-0 print:px-0 print:max-w-full" id="recipe-detail-container">
      {/* Back & Sticky Control bar */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 sm:py-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white shadow-xs hover:border-stone-400 dark:hover:border-stone-500 active:scale-95 transition-all text-sm sm:text-xs font-medium"
          id="detail-back-btn"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Înapoi la Rețete</span>
          <span className="inline sm:hidden">Înapoi</span>
        </button>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex h-[44px] w-[44px] sm:h-9 sm:w-9 items-center justify-center rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 shadow-xs hover:border-stone-400 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all active:scale-95 animate-fade-in"
            title="Printează Rețeta"
          >
            <Printer className="h-4 w-4 sm:h-4 sm:w-4" />
          </button>
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="flex h-[44px] w-[44px] sm:h-9 sm:w-9 items-center justify-center rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 shadow-xs hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95 animate-fade-in"
            title={recipe.isFavorite ? "Elimină de la favorite" : "Adaugă la favorite"}
            id="heart-recipe-btn"
          >
            <Heart className={`h-4 w-4 sm:h-4 sm:w-4 ${recipe.isFavorite ? "text-rose-500 fill-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Title, Category & Description */}
        <div className="text-center md:text-left mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9d5c3d] dark:text-amber-400 tracking-wide mb-2 inline-block">
            {recipe.category}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-stone-900 dark:text-white tracking-tight leading-tight transition-colors duration-500">
            {recipe.title}
          </h1>
          <p className="mt-4 text-stone-600 dark:text-stone-400 leading-relaxed text-sm md:text-base font-serif italic max-w-3xl transition-colors duration-500">
            "{recipe.description}"
          </p>
        </div>

        {/* Master Recipe Details Frame */}
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-3xl border border-stone-100 dark:border-stone-800 shadow-md group mb-8 bg-stone-50 dark:bg-stone-800/50">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-102"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-stone-300 dark:text-stone-700">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Dynamic Badges Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-center transition-colors">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-wider uppercase mb-1">Dificultate</span>
            <span className={`text-sm font-semibold capitalize ${
              recipe.difficulty === 'ușor' ? 'text-emerald-600 dark:text-emerald-400' :
              recipe.difficulty === 'mediu' ? 'text-amber-600 dark:text-amber-400' :
              'text-rose-600 dark:text-rose-400'
            }`}>{recipe.difficulty}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-center transition-colors">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-wider uppercase mb-1">Timp total</span>
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
              <Clock className="h-4 w-4 text-stone-500 dark:text-stone-400" />
              {recipe.prepTime + recipe.cookTime} min
            </span>
          </div>

          <button
            onClick={() => setShowNutritionModal(true)} 
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800 text-center cursor-pointer transition-colors"
          >
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-wider uppercase mb-1">Valori Nutriționale / porție</span>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1" title="Calorii">
                <Flame className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                {recipe.calories || "—"} kcal
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1 underline decoration-stone-300 dark:decoration-stone-600 underline-offset-2 print:hidden">
                <Info className="h-3 w-3" />Vezi detalii
              </span>
            </div>
          </button>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-center transition-colors">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-wider uppercase mb-1">Câte porții?</span>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setCurrentServings(Math.max(1, currentServings - 1))}
                className="flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 text-stone-700 dark:text-stone-300 transition-colors shadow-sm focus:outline-none active:scale-95"
                aria-label="Decrease servings"
              >
                <span className="text-base font-medium leading-none -mt-0.5">-</span>
              </button>
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 min-w-[3rem] text-center flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                {currentServings}
              </span>
              <button
                onClick={() => setCurrentServings(currentServings + 1)}
                className="flex items-center justify-center h-7 w-7 rounded-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 text-stone-700 dark:text-stone-300 transition-colors shadow-sm focus:outline-none active:scale-95"
                aria-label="Increase servings"
              >
                <span className="text-base font-medium leading-none -mt-0.5">+</span>
              </button>
            </div>
          </div>
        </div>

        {/* Master columns for Ingredients and Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
          
          {/* Ingredients Left Panel (Span 5) */}
          <div className="lg:col-span-5 border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-display text-stone-900 dark:text-white tracking-tight">
                Ingrediente
              </h3>

              {/* Dynamic Servings Multiplier Component */}
              <div className="flex items-center gap-2 rounded-full border border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-1 transition-colors print:border-none print:bg-transparent print:p-0">
                <button
                  type="button"
                  onClick={() => setCurrentServings((v) => Math.max(1, v - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 shadow-xs active:scale-90 transition-all font-bold text-xs print:hidden"
                >
                  -
                </button>
                <span className="text-xs font-semibold px-1 text-stone-800 dark:text-stone-200 min-w-[32px] text-center print:text-left print:px-0">
                  {currentServings} {currentServings === 1 ? "porție" : "porții"}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentServings((v) => Math.min(20, v + 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 shadow-xs active:scale-90 transition-all font-bold text-xs print:hidden"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-stone-400 dark:text-stone-500 text-[11px] mb-4 font-normal print:hidden">
              Atinge ingredientele pentru a le bifa pe măsură ce le asamblezi:
            </p>

            <ul className="space-y-3">
              {recipe.ingredients.map((item, index) => {
                const isChecked = !!checkedIngredients[index];
                return (
                  <li
                    key={index}
                    onClick={() => toggleIngredient(index)}
                    className={`flex items-start gap-3 p-3 sm:p-2 rounded-xl cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 border border-transparent hover:border-stone-50 dark:hover:border-stone-800 select-none transition-all duration-200 ${isChecked ? "opacity-45" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-5 w-5 sm:h-4.5 sm:w-4.5 shrink-0 items-center justify-center rounded-md border transition-all ${isChecked ? "bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-900" : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"}`}>
                      {isChecked && <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3 stroke-[3]" />}
                    </div>
                    <span className={`text-stone-700 dark:text-stone-300 text-base sm:text-sm leading-relaxed transition-all ${isChecked ? "line-through text-stone-400 dark:text-stone-500" : ""}`}>
                      {scaleIngredientText(item)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions Right Panel (Span 7) */}
          <div className="lg:col-span-7">
            <h3 className="text-xl font-bold font-display text-stone-900 dark:text-white tracking-tight mb-6">
              Mod de Preparare
            </h3>

            <div className="space-y-6">
              {recipe.instructions.map((step, index) => (
                <div key={index} className="flex gap-4 group">
                  {/* Step counter */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold font-display shadow-xs group-hover:bg-amber-800 dark:group-hover:bg-amber-400 transition-colors duration-250">
                    {index + 1}
                  </div>
                  {/* Step content */}
                  <div className="pt-0.5 flex-1">
                    <p className="text-stone-800 dark:text-stone-300 text-base sm:text-sm leading-relaxed font-sans">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chef's final quote */}
            <div className="mt-10 p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/40 dark:border-amber-900/30">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-500 mb-1">
                Sfatul Bucătarului
              </h4>
              <p className="text-amber-800 dark:text-amber-400 text-xs italic leading-relaxed">
                Asigură-te că folosești ingrediente proaspete, la temperatura camerei, pentru a obține cel mai fin gust și cea mai echilibrată compoziție. Gătește cu răbdare și pasiune!
              </p>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Nutrition Modal */}
      <AnimatePresence>
        {showNutritionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowNutritionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <button
                onClick={() => setShowNutritionModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="text-center mb-6">
                <Flame className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-white font-display">
                  Valori Nutriționale
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Valori estimative pentru o porție
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Calorii</span>
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-200">{recipe.calories || "—"} kcal</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Proteine</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{recipe.protein !== undefined ? `${recipe.protein}g` : "—"}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Carbohidrați</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{recipe.carbs !== undefined ? `${recipe.carbs}g` : "—"}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Grăsimi</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{recipe.fat !== undefined ? `${recipe.fat}g` : "—"}</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowNutritionModal(false)}
                  className="w-full py-2.5 bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold rounded-full hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                >
                  Închide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </article>
  );
}
