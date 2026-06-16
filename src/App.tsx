import { useState, useEffect, FormEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ChefHat, Search, SlidersHorizontal, Eye, Heart, ListFilter, ShieldCheck, ArrowRight, X, Clock, HelpCircle, Loader2
} from "lucide-react";
import { Recipe, Category, RecipeDifficulty } from "./types";
import { INITIAL_RECIPES } from "./data";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import AdminPanel from "./components/AdminPanel";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";

export default function App() {
  // Recipes master store - hydrated from LocalStorage or seeded from INITIAL_RECIPES
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Navigation: "home" | "detail" | "admin"
  const [currentView, setCurrentView] = useState<"home" | "detail" | "admin">("home");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Toate");
  const [selectedDifficulty, setSelectedDifficulty] = useState<RecipeDifficulty | "">("");
  const [maxTime, setMaxTime] = useState<number>(120); // Slider max time filter
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Layout toggles
  const [showFilters, setShowFilters] = useState(false);

  // Admin access passcode state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Local favorites state
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("culinary_favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Firestore sync effect
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "recipes"), (snapshot) => {
      const dbRecipes = snapshot.docs.map(doc => doc.data() as Recipe);
      if (dbRecipes.length > 0) {
        setRecipes(dbRecipes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setRecipes(INITIAL_RECIPES);
      }
      setIsAppLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setIsAppLoading(false);
      // Fallback
      const saved = localStorage.getItem("culinary_recipes");
      if (saved) setRecipes(JSON.parse(saved));
      else setRecipes(INITIAL_RECIPES);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Save changes to Firestore helper
  const handleSaveRecipes = (updated: Recipe[]) => {
    // Only local fallback here
    setRecipes(updated);
    localStorage.setItem("culinary_recipes", JSON.stringify(updated));
  };

  // Recipe Admin Actions
  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await setDoc(doc(db, "recipes", recipe.id), recipe);
    } catch (err) {
      console.error("Error saving recipe:", err);
      // Fallback update
      const updated = recipes.some((r) => r.id === recipe.id) 
        ? recipes.map((r) => (r.id === recipe.id ? recipe : r))
        : [recipe, ...recipes];
      handleSaveRecipes(updated);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteDoc(doc(db, "recipes", id));
    } catch (err) {
      console.error("Error deleting recipe:", err);
      const updated = recipes.filter((r) => r.id !== id);
      handleSaveRecipes(updated);
    }
  };

  // Toggle favorite helper
  const handleToggleFavorite = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    
    setLocalFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("culinary_favorites", JSON.stringify(Array.from(next)));
      return next;
    });

    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, isFavorite: !localFavorites.has(id) } : null);
    }
  };

  // Handle Detail Screen navigation
  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Back from detail helper
  const handleBackToCatalog = () => {
    setSelectedRecipe(null);
    setCurrentView("home");
  };

  // Admin access validation
  const handleRequestAdminMode = () => {
    if (isAdminUnlocked) {
      setCurrentView("admin");
    } else {
      setShowAdminPasscodeModal(true);
      setPasscodeError("");
    }
  };

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setPasscodeError("");
    
    setTimeout(() => {
      if (passcodeInput.toLowerCase().trim() === "sanatos") {
        setIsAdminUnlocked(true);
        setShowAdminPasscodeModal(false);
        setCurrentView("admin");
        setPasscodeInput("");
      } else {
        setPasscodeError("Parolă incorectă.");
      }
      setIsAuthLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setIsAdminUnlocked(false);
    handleBackToCatalog();
  };

  // Category filter list
  const categories: Category[] = ["Toate", "Mic Dejun", "Prânz", "Cină", "Desert", "Gustări"];

  // Filter computation
  const filteredRecipes = recipes.map(r => ({ ...r, isFavorite: localFavorites.has(r.id) })).filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "Toate" ? true : item.category === selectedCategory;
    
    const matchesDifficulty = selectedDifficulty === "" ? true : item.difficulty === selectedDifficulty;
    
    const totalTime = item.prepTime + item.cookTime;
    const matchesTime = totalTime <= maxTime;

    const matchesFavorite = showOnlyFavorites ? !!item.isFavorite : true;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTime && matchesFavorite;
  });

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-6 w-6 text-stone-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans selection:bg-stone-900 selection:text-white" id="main-application-shell">
      
      {/* Decorative Blur Backdrops matching target image atmosphere */}
      <div className="mesh-glow bg-amber-200 -top-40 -left-60" style={{ transform: "rotate(30deg)" }} />
      <div className="mesh-glow bg-blue-100 top-1/3 -right-40" />
      <div className="mesh-glow bg-rose-100 bottom-10 left-10" />

      {/* Top Header Navigation bar */}
      <header className="sticky top-6 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <nav className="flex items-center justify-between rounded-full border border-stone-200/60 bg-white/70 px-6 py-3.5 shadow-xs backdrop-blur-xl">
          {/* Logo Brand */}
          <div 
            onClick={handleBackToCatalog}
            className="flex items-center gap-2 cursor-pointer font-display font-bold text-stone-900 text-lg sm:text-xl tracking-tight select-none"
            id="brand-logo"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white shadow-xs">
              <ChefHat className="h-4.5 w-4.5 stroke-[2]" />
            </div>
            <span>Bespoke Culinary</span>
            <span className="text-stone-400 font-normal">Studio</span>
          </div>

          {/* Quick Stats list or Admin panel button */}
          <div className="flex items-center gap-3">
            {/* Show view toggles if not in admin already */}
            {currentView !== "admin" && (
              <button
                onClick={handleRequestAdminMode}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 hover:bg-stone-800 text-white px-4 py-2 text-xs font-semibold cursor-pointer shadow-sm shadow-stone-950/10 transition-all active:scale-95"
                id="header-admin-btn"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Panou Administrator</span>
              </button>
            )}

            {currentView === "admin" && (
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-white text-stone-600 px-4 py-2 text-xs font-medium cursor-pointer transition-all active:scale-95"
                >
                  Deconectare
                </button>
                <button
                  onClick={handleBackToCatalog}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-white text-stone-800 px-4 py-2 text-xs font-medium cursor-pointer transition-all active:scale-95"
                  id="header-recipes-btn"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Vezi Catalog Public</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Content wrapper depending on active view */}
      <main className="relative pb-24">
        <AnimatePresence mode="wait">
          
          {/* 1. PUBLIC CATALOG VIEW */}
          {currentView === "home" && (
            <motion.section
              key="catalog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12"
            >
              {/* Premium minimalist landing Hero block matching Prompty image */}
              <div className="text-center max-w-4xl mx-auto mb-16">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3.5 py-1 text-[10px] font-bold text-[#9d5c3d] tracking-wider uppercase mb-5">
                  <Sparkles className="h-3 w-3" />
                  Cabinetul gastronomic personal
                </span>
                
                <h2 className="text-4xl sm:text-6xl font-bold font-display text-stone-900 tracking-tight leading-none mb-6">
                  Cel mai simplu mod de a explora rețete gourmet.
                </h2>
                
                <p className="text-sm sm:text-base text-stone-500 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
                  Nu mai uita niciodată ideile culinare geniale. Păstrează, gestionează, editează și gătește cele mai bune preparate dintr-un spațiu de lucru absolut curat, aerisit și rapid.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="#catalog-grid"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 text-xs font-bold shadow-md shadow-stone-900/10 cursor-pointer transition-all active:scale-95"
                  >
                    Răsfoiește Rețete ({recipes.length})
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <button
                    onClick={handleRequestAdminMode}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-white px-6 py-3 text-xs font-semibold text-stone-700 cursor-pointer transition-all active:scale-95"
                  >
                    Adaugă Rețeta Ta
                  </button>
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                  <span className="flex items-center gap-1">✨ FIECARE REȚETĂ EDITABILĂ</span>
                  <span className="flex items-center gap-1">🌿 DESIGN PREMIUM MINIMAL</span>
                </div>
              </div>

              {/* public catalog interface */}
              <div id="catalog-grid" className="border-t border-stone-100 pt-12">
                
                {/* Search & Categories filtering block */}
                <div className="space-y-6 mb-12">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    
                    {/* Horizontal scroll categories */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0 -mx-4 px-4 md:mx-0 md:px-0">
                      {categories.map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer transition-all whitespace-nowrap select-none ${isActive ? "bg-stone-900 text-white shadow-md shadow-stone-950/10" : "bg-white hover:bg-stone-50 text-stone-600 border border-stone-200/75"}`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right filters operations */}
                    <div className="flex items-center gap-3">
                      {/* Search container */}
                      <div className="relative flex-1 md:w-64 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Caută în ingrediente..."
                          className="w-full bg-white border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 shadow-2xs"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Toggle more filters trigger */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border transition-all ${showFilters ? "bg-stone-50 border-stone-400 text-stone-900" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"}`}
                        id="filters-toggle-btn"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Filtre</span>
                      </button>

                      {/* Favorites toggle pill */}
                      <button
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={`p-2 rounded-full cursor-pointer border transition-all ${showOnlyFavorites ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-white border-stone-200 text-stone-400 hover:text-rose-500"}`}
                        title="Arată doar Favoritele"
                        id="favorites-toggle-btn"
                      >
                        <Heart className={`h-4 w-4 ${showOnlyFavorites ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Advanced sliding detailed filters panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden bg-white rounded-2xl border border-stone-100 p-5 shadow-2xs space-y-4"
                        id="filters-sliding-panel"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Difficulty Filter */}
                          <div>
                            <span className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2.5">
                              Dificultate Rețetă
                            </span>
                            <div className="flex gap-2">
                              {/* Option All */}
                              <button
                                onClick={() => setSelectedDifficulty("")}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-xl border text-center cursor-pointer transition-all ${selectedDifficulty === "" ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 hover:border-stone-400 text-stone-600"}`}
                              >
                                Toate
                              </button>
                              {(["ușor", "mediu", "dificil"] as RecipeDifficulty[]).map((dif) => (
                                <button
                                  key={dif}
                                  onClick={() => setSelectedDifficulty(dif)}
                                  className={`flex-1 py-1.5 text-xs font-medium rounded-xl border text-center capitalize cursor-pointer transition-all ${selectedDifficulty === dif ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 hover:border-stone-400 text-stone-600"}`}
                                >
                                  {dif}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cook time limit filter slider */}
                          <div>
                            <div className="flex justify-between items-center mb-2.5 text-xs font-bold text-stone-700 uppercase tracking-wide">
                              <span>Timp Maxim Preparare</span>
                              <span className="text-stone-500 lowercase font-semibold">{maxTime} min</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="180"
                              step="5"
                              value={maxTime}
                              onChange={(e) => setMaxTime(Number(e.target.value))}
                              className="w-full accent-stone-900 cursor-pointer h-1.5 bg-stone-100 rounded-lg appearance-none"
                            />
                            <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                              <span>10 min</span>
                              <span>Rapid (sub 30m)</span>
                              <span>180 min</span>
                            </div>
                          </div>

                          {/* Quick Clean settings */}
                          <div className="flex items-end md:justify-end">
                            <button
                              onClick={() => {
                                setSelectedDifficulty("");
                                setMaxTime(120);
                                setSelectedCategory("Toate");
                                setSearchQuery("");
                                setShowOnlyFavorites(false);
                              }}
                              className="text-xs font-semibold text-stone-400 hover:text-stone-900 underline underline-offset-4 decoration-stone-200 cursor-pointer"
                            >
                              Resetează Toate Filtrele
                            </button>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Grid List layout render */}
                <AnimatePresence mode="popLayout">
                  {filteredRecipes.length === 0 ? (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-20 p-8 border border-stone-100 rounded-3xl bg-white max-w-md mx-auto"
                    >
                      <ListFilter className="mx-auto h-12 w-12 text-stone-300 stroke-[1.5] mb-4 animate-pulse" />
                      <h3 className="text-sm font-semibold text-stone-800">Niciun rezultat găsit</h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-normal">
                        Nicio rețetă nu corespunde combinărilor de căutare alese. Încearcă să restructurezi termenii sau resetează filtrele.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory("Toate");
                          setSelectedDifficulty("");
                          setMaxTime(120);
                          setSearchQuery("");
                          setShowOnlyFavorites(false);
                        }}
                        className="mt-4 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-semibold px-4 py-2 cursor-pointer transition-all"
                      >
                        Resetează Filtrele
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      layout
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10"
                    >
                      {filteredRecipes.map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          onViewDetails={handleViewDetails}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* 2. RECIPE DETAILS COMPONENT */}
          {currentView === "detail" && selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              onBack={handleBackToCatalog}
              onToggleFavorite={() => handleToggleFavorite(selectedRecipe.id)}
            />
          )}

          {/* 3. ADMIN PANEL SCREEN */}
          {currentView === "admin" && (
            <AdminPanel
              recipes={recipes}
              onSaveRecipe={handleSaveRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onClose={handleBackToCatalog}
            />
          )}

        </AnimatePresence>
      </main>

      {/* 4. MODAL PIN LOCK SECURE ADMIN CABINET */}
      <AnimatePresence>
        {showAdminPasscodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md" id="passcode-modal">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl border border-stone-100 max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              {/* Close Button absolute top right */}
              <button
                onClick={() => setShowAdminPasscodeModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 p-1 rounded-full hover:bg-stone-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-50 text-stone-900 border border-stone-100 mb-4">
                  <ChefHat className="h-6 w-6 text-stone-700" />
                </div>
                <h3 className="text-lg font-bold font-display text-stone-900 tracking-tight">Deblochează Panou Administrator</h3>
                <p className="text-stone-500 text-xs mt-1.5 leading-normal">
                  Pentru securitate, te rugăm să confirmi parola de acces în cabinetul tău culinar.
                </p>
              </div>

              {/* Login screen */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Parolă administrator</label>
                  <input
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      setPasscodeError("");
                    }}
                    placeholder="Introdu parola..."
                    className="w-full text-center text-lg tracking-[0.2em] font-mono bg-stone-50 border border-stone-200 rounded-xl py-2.5 focus:outline-none focus:border-stone-500 focus:bg-white text-stone-800 shadow-2xs/10 font-bold"
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-rose-500 font-medium text-center mt-2">
                      {passcodeError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 hover:bg-stone-800 text-white py-3 text-sm font-semibold shadow-md cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Conectare"
                    )}
                  </button>
                </div>
              </form>

              {/* Info Text */}
              <div className="pt-4 border-t border-stone-100/65 flex items-start gap-2 text-[10px] text-stone-400 leading-normal font-normal">
                <HelpCircle className="h-4 w-4 text-stone-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-500 text-[11px] mb-0.5">Acces Administrator:</p>
                  <p>Adaugă, editează sau șterge rețete exclusiv prin parola setată.</p>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding credits */}
      <footer className="border-t border-stone-100 py-10 mt-20 text-center text-xs text-stone-400 relative">
        <p>© 2026 Bespoke Culinary Studio. Creat pentru iubitorii de design curat și gusturi excepționale.</p>
        <p className="mt-1 text-[10px] text-stone-300">Design exclusivist • Tehnologie Gemini AI</p>
      </footer>

    </div>
  );
}
