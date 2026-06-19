import { useState, useEffect, FormEvent, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ChefHat, Search, SlidersHorizontal, Eye, Heart, ListFilter, ShieldCheck, ArrowRight, X, Clock, HelpCircle, Loader2, Moon, Sun } from "lucide-react";
import { Recipe, Category, RecipeDifficulty } from "./types";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import AdminPanel from "./components/AdminPanel";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";

export default function App() {
  // Recipes master store - hydrated from LocalStorage
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

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("culinary_theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("culinary_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Local favorites state
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("culinary_favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Firestore sync effect
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "recipes"), (snapshot) => {
      const dbRecipes = snapshot.docs.map(doc => doc.data() as Recipe);
      setRecipes(dbRecipes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setIsAppLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setIsAppLoading(false);
      // Fallback
      const saved = localStorage.getItem("culinary_recipes");
      if (saved) setRecipes(JSON.parse(saved));
      else setRecipes([]);
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

  const handleImportRecipes = async (importedRecipes: Recipe[]) => {
    try {
      const dbPromises = importedRecipes.map(r => setDoc(doc(db, "recipes", r.id), r));
      await Promise.all(dbPromises);
    } catch (err) {
      console.error("Error bulk saving recipes to Firestore:", err);
    }
    const map = new Map(recipes.map(r => [r.id, r]));
    importedRecipes.forEach(r => map.set(r.id, r));
    const merged = Array.from(map.values());
    handleSaveRecipes(merged);
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Loader2 className="h-6 w-6 text-stone-900 dark:text-stone-100 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full overflow-x-hidden font-sans selection:bg-stone-900 selection:text-white dark:selection:bg-white dark:selection:text-stone-900 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-500 ${darkMode ? 'dark' : ''}`} id="main-application-shell">
      
      {/* Decorative Blur Backdrops matching target image atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 print:hidden">
        <div className="mesh-glow bg-amber-200 dark:bg-amber-900/30 -top-40 -left-60 transition-colors duration-500" style={{ transform: "rotate(30deg)" }} />
        <div className="mesh-glow bg-blue-100 dark:bg-blue-900/20 top-1/3 -right-40 transition-colors duration-500" />
        <div className="mesh-glow bg-rose-100 dark:bg-rose-900/20 bottom-10 left-10 transition-colors duration-500" />
      </div>

      {/* Top Header Navigation bar */}
      <header className="sticky top-2 sm:top-6 z-40 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mb-4 print:hidden">
        <nav className="flex items-center justify-between rounded-full border border-stone-200/60 dark:border-white/10 bg-white/70 dark:bg-stone-900/70 px-4 sm:px-6 py-2.5 sm:py-3.5 shadow-xs backdrop-blur-xl transition-colors duration-500">
          {/* Logo Brand */}
          <div 
            onClick={handleBackToCatalog}
            className="flex items-center gap-2 cursor-pointer font-display font-bold text-stone-900 dark:text-white text-base sm:text-lg lg:text-xl tracking-tight select-none"
            id="brand-logo"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs transition-colors duration-500">
              <ChefHat className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2]" />
            </div>
            <span className="hidden sm:inline-block truncate">Robert's Cookbook</span>
            <span className="inline-block sm:hidden truncate">Robert's</span>
          </div>

          {/* Quick Stats list or Admin panel button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 rounded-full cursor-pointer text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={darkMode ? "Treci la modul luminos" : "Treci la modul întunecat"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={darkMode ? 'dark' : 'light'}
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Show view toggles if not in admin already */}
            {currentView !== "admin" && (
              <button
                onClick={handleRequestAdminMode}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 px-3 sm:px-4 py-2 text-xs font-semibold cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap"
                id="header-admin-btn"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Panou Administrator</span>
                <span className="inline sm:hidden">Admin</span>
              </button>
            )}

            {currentView === "admin" && (
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-4 py-2 text-xs font-medium cursor-pointer transition-all active:scale-95"
                >
                  Deconectare
                </button>
                <button
                  onClick={handleBackToCatalog}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 px-4 py-2 text-xs font-medium cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-95"
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
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 px-3.5 py-1 text-[10px] font-bold text-[#9d5c3d] dark:text-amber-400 tracking-wider uppercase mb-5">
                    <Sparkles className="h-3 w-3" />
                    Cabinetul nutrițional personal
                  </span>
                  
                  <h2 className="text-4xl sm:text-6xl font-bold font-display text-stone-900 dark:text-white tracking-tight leading-none mb-6 transition-colors duration-500">
                    Cel mai simplu mod de a explora rețete sănătoase pentru sală.
                  </h2>
                  
                  <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed font-normal mb-8 transition-colors duration-500">
                    Nu mai uita niciodată ideile pentru mese consistente. Păstrează, gestionează, editează și gătește cele mai bune preparate fitness dintr-un spațiu de lucru absolut curat, aerisit și rapid.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                  <a
                    href="#catalog-grid"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 px-6 py-3 text-xs font-bold shadow-md shadow-stone-900/10 cursor-pointer transition-colors"
                  >
                    Răsfoiește Rețete ({recipes.length})
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <button
                    onClick={handleRequestAdminMode}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 bg-white dark:bg-stone-800 px-6 py-3 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    Adaugă Rețeta Ta
                  </button>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="flex items-center justify-center gap-6 mt-6 text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider"
                >
                  <span className="flex items-center gap-1">✨ FIECARE REȚETĂ EDITABILĂ</span>
                  <span className="flex items-center gap-1">🌿 DESIGN PREMIUM MINIMAL</span>
                </motion.div>
              </div>

              {/* public catalog interface */}
              <div id="catalog-grid" className="border-t border-stone-100 dark:border-stone-800/50 pt-12 transition-colors duration-500">
                
                {/* Search & Categories filtering block */}
                <div className="space-y-6 mb-8 md:mb-12">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    
                    {/* Horizontal scroll categories */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 shrink-0 -mx-4 px-4 md:mx-0 md:px-0">
                      {categories.map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 md:px-4 md:py-2 text-sm md:text-xs font-semibold rounded-full cursor-pointer transition-all whitespace-nowrap select-none ${isActive ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md shadow-stone-950/10" : "bg-white dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 border border-stone-200/75 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"}`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right filters operations */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      {/* Search container */}
                      <div className="relative flex-1 min-w-[200px] md:w-64 max-w-full sm:max-w-sm group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-4 md:w-4 text-stone-400 group-focus-within:text-stone-900 dark:group-focus-within:text-white transition-colors" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Caută în ingrediente..."
                          className="w-full bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 rounded-full pl-10 pr-4 py-3 md:py-2 text-sm md:text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-500 dark:focus:border-stone-400 shadow-sm transition-colors duration-300"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                          >
                            <X className="h-4 w-4 md:h-3 md:w-3" />
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-none">
                        {/* Toggle more filters trigger */}
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className={`inline-flex items-center justify-center gap-1.5 px-4 md:px-4 py-3 md:py-2 h-[46px] md:h-auto rounded-full text-sm md:text-xs font-semibold cursor-pointer border transition-all ${showFilters ? "bg-stone-50 dark:bg-stone-800 border-stone-400 text-stone-900 dark:text-white" : "bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500"}`}
                          id="filters-toggle-btn"
                        >
                          <SlidersHorizontal className="h-4 w-4 md:h-3.5 md:w-3.5" />
                          <span className="hidden sm:inline-block">Filtre</span>
                        </button>

                        {/* Favorites toggle pill */}
                        <button
                          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                          className={`p-3 md:p-2 h-[46px] w-[46px] md:h-auto md:w-auto flex items-center justify-center rounded-full cursor-pointer border transition-all ${showOnlyFavorites ? "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400" : "bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-500 dark:hover:text-rose-400"}`}
                          title="Arată doar Favoritele"
                          id="favorites-toggle-btn"
                        >
                          <Heart className={`h-5 w-5 md:h-4 md:w-4 transition-colors ${showOnlyFavorites ? "fill-current text-rose-500 dark:text-rose-400" : ""}`} />
                        </button>
                      </div>
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
                        className="overflow-hidden bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5 shadow-2xs space-y-4"
                        id="filters-sliding-panel"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Difficulty Filter */}
                          <div>
                            <span className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-2.5">
                              Dificultate Rețetă
                            </span>
                            <div className="flex gap-2">
                              {/* Option All */}
                              <button
                                onClick={() => setSelectedDifficulty("")}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-xl border text-center cursor-pointer transition-all ${selectedDifficulty === "" ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900" : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400"}`}
                              >
                                Toate
                              </button>
                              {(["ușor", "mediu", "dificil"] as RecipeDifficulty[]).map((dif) => (
                                <button
                                  key={dif}
                                  onClick={() => setSelectedDifficulty(dif)}
                                  className={`flex-1 py-1.5 text-xs font-medium rounded-xl border text-center capitalize cursor-pointer transition-all ${selectedDifficulty === dif ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900" : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400"}`}
                                >
                                  {dif}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cook time limit filter slider */}
                          <div>
                            <div className="flex justify-between items-center mb-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                              <span>Timp Maxim Preparare</span>
                              <span className="text-stone-500 dark:text-stone-400 lowercase font-semibold">{maxTime} min</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="180"
                              step="5"
                              value={maxTime}
                              onChange={(e) => setMaxTime(Number(e.target.value))}
                              className="w-full accent-stone-900 dark:accent-stone-100 cursor-pointer h-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg appearance-none"
                            />
                            <div className="flex justify-between text-[10px] text-stone-400 dark:text-stone-500 mt-1">
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
                              className="text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline underline-offset-4 decoration-stone-200 dark:decoration-stone-700 cursor-pointer transition-colors"
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
                      className="text-center py-20 p-8 border border-stone-100 dark:border-stone-800 rounded-3xl bg-white dark:bg-stone-900 max-w-md mx-auto"
                    >
                      <ListFilter className="mx-auto h-12 w-12 text-stone-300 dark:text-stone-600 stroke-[1.5] mb-4 animate-pulse" />
                      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Niciun rezultat găsit</h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto leading-normal">
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
                        className="mt-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-full text-xs font-semibold px-4 py-2 cursor-pointer transition-all"
                      >
                        Resetează Filtrele
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      layout
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.1 }
                        }
                      }}
                      initial="hidden"
                      animate="show"
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
              onImportRecipes={handleImportRecipes}
              onClose={handleBackToCatalog}
            />
          )}

        </AnimatePresence>
      </main>

      {/* 4. MODAL PIN LOCK SECURE ADMIN CABINET */}
      <AnimatePresence>
        {showAdminPasscodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/70 backdrop-blur-md" id="passcode-modal">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              {/* Close Button absolute top right */}
              <button
                onClick={() => setShowAdminPasscodeModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 p-1 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-100 dark:border-stone-700 mb-4">
                  <ChefHat className="h-6 w-6 text-stone-700 dark:text-stone-300" />
                </div>
                <h3 className="text-lg font-bold font-display text-stone-900 dark:text-white tracking-tight">Deblochează Panou Administrator</h3>
                <p className="text-stone-500 dark:text-stone-400 text-xs mt-1.5 leading-normal">
                  Pentru securitate, te rugăm să confirmi parola de acces în cabinetul tău culinar.
                </p>
              </div>

              {/* Login screen */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Parolă administrator</label>
                  <input
                    type="password"
                    required
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      setPasscodeError("");
                    }}
                    placeholder="Introdu parola..."
                    className="w-full text-center text-lg tracking-[0.2em] font-mono bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl py-2.5 focus:outline-none focus:border-stone-500 dark:focus:border-stone-400 focus:bg-white dark:focus:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] font-bold transition-colors"
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium text-center mt-2">
                      {passcodeError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 py-3 text-sm font-semibold shadow-md cursor-pointer transition-all disabled:opacity-50"
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
              <div className="pt-4 border-t border-stone-100/65 dark:border-stone-800/65 flex items-start gap-2 text-[10px] text-stone-400 dark:text-stone-500 leading-normal font-normal">
                <HelpCircle className="h-4 w-4 text-stone-300 dark:text-stone-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">Acces Administrator:</p>
                  <p>Adaugă, editează sau șterge rețete exclusiv prin parola setată.</p>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding credits */}
      <footer className="border-t border-stone-100 dark:border-stone-800/50 py-10 mt-20 text-center text-xs text-stone-400 dark:text-stone-500 relative transition-colors duration-500">
        <p>© 2026 Robert's Cookbook. Creat pentru iubitorii de design curat și gusturi excepționale.</p>
        <p className="mt-1 text-[10px] text-stone-300 dark:text-stone-600">Design exclusivist</p>
      </footer>

    </div>
  );
}
