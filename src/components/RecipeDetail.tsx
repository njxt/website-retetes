import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Users, Flame, Check, Heart, Share2, Printer, X, Info } from "lucide-react";
import { Recipe } from "../types";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function RecipeDetail({ recipe, onBack, onToggleFavorite }: RecipeDetailProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [currentServings, setCurrentServings] = useState<number>(recipe.servings);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleShare = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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
    <article className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8" id="recipe-detail-container">
      {/* Back & Sticky Control bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-600 hover:text-stone-900 shadow-xs hover:border-stone-400 active:scale-95 transition-all text-xs font-medium"
          id="detail-back-btn"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Înapoi la Rețete
        </button>

        <div className="flex items-center gap-2">
          {/* Print button */}
          <button
            onClick={handlePrint}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 hover:text-stone-900 shadow-xs hover:border-stone-300 transition-all active:scale-95"
            title="Tipărește rețeta"
            id="print-recipe-btn"
          >
            <Printer className="h-4 w-4" />
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 hover:text-stone-900 shadow-xs hover:border-stone-300 transition-all active:scale-95 relative"
            title="Copiază link-ul"
            id="share-recipe-btn"
          >
            <Share2 className="h-4 w-4" />
            {copiedLink && (
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md whitespace-nowrap">
                Copiat!
              </span>
            )}
          </button>

          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 hover:text-rose-600 shadow-xs hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95 animate-fade-in"
            title={recipe.isFavorite ? "Elimină de la favorite" : "Adaugă la favorite"}
            id="heart-recipe-btn"
          >
            <Heart className={`h-4 w-4 ${recipe.isFavorite ? "text-rose-500 fill-rose-500" : ""}`} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title, Category & Description */}
        <div className="text-center md:text-left mb-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9d5c3d] tracking-wide mb-2 inline-block">
            {recipe.category}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-stone-900 tracking-tight leading-tight">
            {recipe.title}
          </h1>
          <p className="mt-4 text-stone-600 leading-relaxed text-sm md:text-base font-serif italic max-w-3xl">
            "{recipe.description}"
          </p>
        </div>

        {/* Master Recipe Details Frame */}
        <div className="relative aspect-16/9 w-full overflow-hidden rounded-3xl border border-stone-100 shadow-md group mb-8">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-102"
          />
        </div>

        {/* Dynamic Badges Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-[10px] text-stone-400 font-medium tracking-wider uppercase mb-1">Dificultate</span>
            <span className="text-sm font-semibold text-stone-800 capitalize">{recipe.difficulty}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-[10px] text-stone-400 font-medium tracking-wider uppercase mb-1">Timp total</span>
            <span className="text-sm font-semibold text-stone-800 flex items-center gap-1">
              <Clock className="h-4 w-4 text-stone-500" />
              {recipe.prepTime + recipe.cookTime} min
            </span>
          </div>

          <button
            onClick={() => setShowNutritionModal(true)} 
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-100 text-center cursor-pointer transition-colors"
          >
            <span className="text-[10px] text-stone-400 font-medium tracking-wider uppercase mb-1">Valori Nutriționale / porție</span>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-stone-800 flex items-center gap-1" title="Calorii">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                {recipe.calories || "—"} kcal
              </span>
              <span className="text-[10px] text-stone-500 mt-1 flex items-center gap-1 underline decoration-stone-300 underline-offset-2">
                <Info className="h-3 w-3" />Vezi detalii
              </span>
            </div>
          </button>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-[10px] text-stone-400 font-medium tracking-wider uppercase mb-1">Porții Rețetă</span>
            <span className="text-sm font-semibold text-stone-800 flex items-center gap-1">
              <Users className="h-4 w-4 text-stone-500" />
              {recipe.servings} {recipe.servings === 1 ? "porție" : "porții"}
            </span>
          </div>
        </div>

        {/* Master columns for Ingredients and Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
          
          {/* Ingredients Left Panel (Span 5) */}
          <div className="lg:col-span-5 border border-stone-100 bg-white rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-display text-stone-900 tracking-tight">
                Ingrediente
              </h3>

              {/* Dynamic Servings Multiplier Component */}
              <div className="flex items-center gap-2 rounded-full border border-stone-100 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setCurrentServings((v) => Math.max(1, v - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white hover:bg-stone-100 text-stone-700 shadow-xs active:scale-90 transition-all font-bold text-xs"
                >
                  -
                </button>
                <span className="text-xs font-semibold px-1 text-stone-800 min-w-[32px] text-center">
                  {currentServings}p
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentServings((v) => Math.min(20, v + 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white hover:bg-stone-100 text-stone-700 shadow-xs active:scale-90 transition-all font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-stone-400 text-[11px] mb-4 font-normal">
              Atinge ingredientele pentru a le bifa pe măsură ce le asamblezi:
            </p>

            <ul className="space-y-3">
              {recipe.ingredients.map((item, index) => {
                const isChecked = !!checkedIngredients[index];
                return (
                  <li
                    key={index}
                    onClick={() => toggleIngredient(index)}
                    className={`flex items-start gap-3 p-2 rounded-xl cursor-pointer hover:bg-stone-50 border border-transparent hover:border-stone-50 select-none transition-all duration-200 ${isChecked ? "opacity-45" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all ${isChecked ? "bg-stone-900 border-stone-900 text-white" : "border-stone-300 bg-white"}`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className={`text-stone-700 text-sm leading-relaxed transition-all ${isChecked ? "line-through text-stone-400" : ""}`}>
                      {scaleIngredientText(item)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions Right Panel (Span 7) */}
          <div className="lg:col-span-7">
            <h3 className="text-xl font-bold font-display text-stone-900 tracking-tight mb-6">
              Mod de Preparare
            </h3>

            <div className="space-y-6">
              {recipe.instructions.map((step, index) => (
                <div key={index} className="flex gap-4 group">
                  {/* Step counter */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white text-xs font-semibold font-display shadow-xs group-hover:bg-amber-800 transition-colors duration-250">
                    {index + 1}
                  </div>
                  {/* Step content */}
                  <div className="pt-0.5 flex-1">
                    <p className="text-stone-800 text-sm leading-relaxed font-sans">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chef's final quote */}
            <div className="mt-10 p-6 rounded-3xl bg-amber-50/50 border border-amber-100/40">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
                Sfatul Bucătarului
              </h4>
              <p className="text-amber-800 text-xs italic leading-relaxed">
                Asigură-te că folosești ingrediente proaspete, la temperatura camerei, pentru a obține cel mai fin gust și cea mai echilibrată compoziție. Gătește cu răbdare și pasiune!
              </p>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Nutrition Modal */}
      <AnimatePresence>
        {showNutritionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden p-6"
            >
              <button
                onClick={() => setShowNutritionModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="text-center mb-6">
                <Flame className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-stone-900 font-display">
                  Valori Nutriționale
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Valori estimative pentru o porție
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600">Calorii</span>
                  <span className="text-sm font-bold text-stone-900">{recipe.calories || "—"} kcal</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600">Proteine</span>
                  <span className="text-sm font-bold text-blue-600">{recipe.protein !== undefined ? `${recipe.protein}g` : "—"}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600">Carbohidrați</span>
                  <span className="text-sm font-bold text-amber-600">{recipe.carbs !== undefined ? `${recipe.carbs}g` : "—"}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl">
                  <span className="text-sm font-medium text-stone-600">Grăsimi</span>
                  <span className="text-sm font-bold text-rose-600">{recipe.fat !== undefined ? `${recipe.fat}g` : "—"}</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowNutritionModal(false)}
                  className="w-full py-2.5 bg-stone-950 text-white text-sm font-semibold rounded-full hover:bg-stone-800 transition-colors"
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
