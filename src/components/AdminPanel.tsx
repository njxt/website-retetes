import React, { useState, useEffect, FormEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Trash2, Edit2, AlertCircle, Save, X, Eye, ChevronRight, Play, Camera, Download, Upload
} from "lucide-react";
import { Recipe, RecipeDifficulty } from "../types";
import RecipeCard from "./RecipeCard";

interface AdminPanelProps {
  recipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onImportRecipes: (recipes: Recipe[]) => void;
  onClose: () => void;
}

export default function AdminPanel({ recipes, onSaveRecipe, onDeleteRecipe, onImportRecipes, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Mic Dejun");
  const [prepTime, setPrepTime] = useState<number>(15);
  const [cookTime, setCookTime] = useState<number>(15);
  const [servings, setServings] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>("ușor");
  const [calories, setCalories] = useState<number>(300);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  
  // AI assist state
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

  // Error validations
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Prepopulate form if editing, reset otherwise
  useEffect(() => {
    if (editingRecipe) {
      setTitle(editingRecipe.title);
      setDescription(editingRecipe.description);
      setImageUrl(editingRecipe.imageUrl);
      setCategory(editingRecipe.category);
      setPrepTime(editingRecipe.prepTime);
      setCookTime(editingRecipe.cookTime);
      setServings(editingRecipe.servings);
      setDifficulty(editingRecipe.difficulty);
      setCalories(editingRecipe.calories || 300);
      setProtein(editingRecipe.protein || 0);
      setCarbs(editingRecipe.carbs || 0);
      setFat(editingRecipe.fat || 0);
      setIngredients(editingRecipe.ingredients);
      setInstructions(editingRecipe.instructions);
      setActiveTab("form");
    } else {
      resetForm();
    }
  }, [editingRecipe]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl(""); 
    setCategory("Mic Dejun");
    setPrepTime(0);
    setCookTime(0);
    setServings(1);
    setDifficulty("ușor");
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setIngredients([""]);
    setInstructions([""]);
    setFormErrors([]);
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "roberts_cookbook_backup.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          onImportRecipes(imported);
          alert("Rețete importate cu succes!");
        } else {
          alert("Fișierul JSON trebuie să conțină un array de rețete!");
        }
      } catch (err) {
        alert("Eroare la parsarea fișierului JSON!");
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateNew = () => {
    setEditingRecipe(null);
    resetForm();
    setActiveTab("form");
  };

  // Dynamic lists modifiers
  const handleAddIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated.length ? updated : [""]);
  };

  const handleIngredientChange = (index: number, val: string) => {
    const updated = [...ingredients];
    updated[index] = val;
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const handleRemoveInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated.length ? updated : [""]);
  };

  const handleInstructionChange = (index: number, val: string) => {
    const updated = [...instructions];
    updated[index] = val;
    setInstructions(updated);
  };

  // Submit Recipe
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!title.trim()) errors.push("Titlul rețetei este obligatoriu.");
    if (!description.trim()) errors.push("Descrierea rețetei este obligatorie.");
    if (!imageUrl.trim()) errors.push("Adresa URL a fotografiei este obligatorie.");
    
    const validIngredients = ingredients.filter(i => i.trim() !== "");
    if (validIngredients.length === 0) errors.push("Adăugați cel puțin un ingredient valid.");
    
    const validInstructions = instructions.filter(i => i.trim() !== "");
    if (validInstructions.length === 0) errors.push("Adăugați cel puțin un pas valid de preparare.");

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const savedRecipe: Recipe = {
      id: editingRecipe?.id || `rec-${Date.now()}`,
      title,
      description,
      imageUrl,
      category,
      prepTime,
      cookTime,
      servings,
      difficulty,
      ingredients: validIngredients,
      instructions: validInstructions,
      calories,
      protein,
      carbs,
      fat,
      isFavorite: editingRecipe?.isFavorite || false,
      createdAt: editingRecipe?.createdAt || new Date().toISOString()
    };

    onSaveRecipe(savedRecipe);
    setEditingRecipe(null);
    resetForm();
    setActiveTab("list");
  };

  // Helper temporary Preview Recipe
  const previewRecipeObj: Recipe = {
    id: editingRecipe?.id || "preview-temp",
    title: title || "Titlu Rețetă",
    description: description || "Descriere lungă sau scurtă a preparatului perfect...",
    imageUrl: imageUrl || "",
    category,
    prepTime,
    cookTime,
    servings,
    difficulty,
    ingredients,
    instructions,
    calories,
    protein,
    carbs,
    fat,
    isFavorite: false,
    createdAt: new Date().toISOString()
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8" id="admin-panel-container">
      <AnimatePresence>
        {recipeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm cursor-pointer"
              onClick={() => setRecipeToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-xl overflow-hidden p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
                <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">Ștergere Rețetă</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                Ești sigur că vrei să ștergi această rețetă? Acțiunea este ireversibilă.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setRecipeToDelete(null)}
                  className="px-6 py-2.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={() => {
                    onDeleteRecipe(recipeToDelete);
                    setRecipeToDelete(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Confirmă
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Title Block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-stone-900 dark:text-white tracking-tight">
            Panou Administrativ
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-normal">
            Adaugă, editează sau restructurează pentru a menține colecția de rețete.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "list" && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-4 py-2 text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
                title="Importă din Fișier"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Importă Backup</span>
              </button>
              <button
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-4 py-2 text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
                title="Descarcă Backup"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportă Backup</span>
              </button>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 px-4 sm:px-4 py-3 sm:py-2 text-sm sm:text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95"
                id="admin-create-new-btn"
              >
                <Plus className="h-4 w-4" />
                Adaugă Rețetă
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-4 sm:px-4 py-3 sm:py-2 text-sm sm:text-xs font-medium cursor-pointer transition-all active:scale-95"
            id="admin-exit-btn"
          >
            Ieșire Admin
          </button>
        </div>
      </div>

      {/* Tabs list/form */}
      <div className="flex mb-8 p-1 bg-stone-100 dark:bg-stone-800/50 rounded-2xl max-w-sm">
        <button
          onClick={() => { setActiveTab("list"); setEditingRecipe(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl text-center cursor-pointer transition-all ${activeTab === "list" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs" : "text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200"}`}
        >
          Toate Rețetele ({recipes.length})
        </button>
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl text-center cursor-pointer transition-all ${activeTab === "form" ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs" : "text-stone-500 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-200"}`}
        >
          {editingRecipe ? "Editează Rețetă" : "Formular Rețetă"}
        </button>
      </div>

      {/* Actual View render */}
      <AnimatePresence mode="wait">
        {activeTab === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden"
          >
            {recipes.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-stone-300 dark:text-stone-700 stroke-[1.5] mb-4" />
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Nicio rețetă înregistrată</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Poți adăuga una acum, sau poți reseta valoarea inițială.</p>
                <button
                  onClick={handleCreateNew}
                  className="mt-4 inline-flex items-center gap-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 rounded-full text-xs font-semibold"
                >
                  Creează prima rețetă
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800 text-stone-400 text-[10px] font-bold uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                      <th className="py-4 px-6 text-stone-500 dark:text-stone-400">Imagine & Denumire</th>
                      <th className="py-4 px-6 text-stone-500 dark:text-stone-400">Categorie</th>
                      <th className="py-4 px-6 md:table-cell hidden text-stone-500 dark:text-stone-400">Timp Gătire</th>
                      <th className="py-4 px-6 md:table-cell hidden text-stone-500 dark:text-stone-400">Dificultate</th>
                      <th className="py-4 px-6 text-right text-stone-500 dark:text-stone-400">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
                    {recipes.map((rec) => (
                      <tr key={rec.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {rec.imageUrl ? (
                              <img
                                src={rec.imageUrl}
                                alt={rec.title}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover border border-stone-100 dark:border-stone-800 shrink-0 bg-stone-100 dark:bg-stone-800"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-stone-100 dark:border-stone-800 shrink-0 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-300 dark:text-stone-700">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-1">{rec.title}</h4>
                              <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-1 mt-0.5">{rec.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                            {rec.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 md:table-cell hidden text-stone-600 dark:text-stone-400 font-medium text-xs">
                          {rec.prepTime + rec.cookTime} minute
                        </td>
                        <td className="py-4 px-6 md:table-cell hidden">
                          <span className="text-xs font-medium text-stone-800 dark:text-stone-200 capitalize">
                            {rec.difficulty}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setEditingRecipe(rec)}
                            className="p-2 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl border border-stone-100 dark:border-stone-700 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            title="Modifica Reteta"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setRecipeToDelete(rec.id)}
                            className="p-2 ml-1 text-rose-500 bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-700 dark:hover:text-rose-400 rounded-xl border border-stone-100 dark:border-stone-700 shadow-2xs cursor-pointer inline-flex items-center justify-center"
                            title="Sterge Reteta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
          >
            {/* Form column (Span 7) */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* General details title/desc */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 border-b border-stone-50 dark:border-stone-800 pb-2">Detalii Generale</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Titlu Rețetă</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Paste cu Sos de Hribi"
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 sm:py-2 text-sm sm:text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Descriere preparat</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="O scurtă descriere ispititoare care să atragă..."
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 sm:py-2 text-sm sm:text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Categorie rețetă</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 sm:py-2 text-sm sm:text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200 cursor-pointer"
                    >
                      <option value="Mic Dejun">Mic Dejun</option>
                      <option value="Prânz">Prânz</option>
                      <option value="Cină">Cină</option>
                      <option value="Desert">Desert</option>
                      <option value="Gustări">Gustări</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Imagine Rețetă</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Adresa URL completă"
                        className="flex-1 w-full min-w-0 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 sm:py-2 text-sm sm:text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                      />
                      <label className="flex items-center justify-center h-[46px] sm:h-9 px-4 sm:px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl cursor-pointer border border-stone-200 dark:border-stone-700 transition-colors shrink-0" title="Încarcă poză (Galerie sau Cameră)">
                        <Camera className="h-5 w-5 sm:h-4 sm:w-4" />
                        <span className="ml-2 text-sm sm:text-xs font-semibold sm:hidden">Foto</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  let width = img.width;
                                  let height = img.height;
                                  const max_size = 800;
                                  
                                  if (width > height) {
                                    if (width > max_size) {
                                      height *= max_size / width;
                                      width = max_size;
                                    }
                                  } else {
                                    if (height > max_size) {
                                      width *= max_size / height;
                                      height = max_size;
                                    }
                                  }
                                  
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                    setImageUrl(dataUrl);
                                  }
                                };
                                img.src = reader.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Prep (min)</label>
                    <input
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Gătire (min)</label>
                    <input
                      type="number"
                      value={cookTime}
                      onChange={(e) => setCookTime(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Porții</label>
                    <input
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Calorii (kcal)</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pb-2 border-b border-stone-50 dark:border-stone-800">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Proteine (g)</label>
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Carbohidrați (g)</label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-900/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Grăsimi (g)</label>
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(Number(e.target.value))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-rose-500 text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Dificultate</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["ușor", "mediu", "dificil"] as RecipeDifficulty[]).map((dif) => (
                      <button
                        type="button"
                        key={dif}
                        onClick={() => setDifficulty(dif)}
                        className={`py-2 text-xs font-semibold rounded-xl border text-center uppercase cursor-pointer transition-all ${difficulty === dif ? "bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900 shadow-xs" : "bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500"}`}
                      >
                        {dif}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Ingredients list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-50 dark:border-stone-800 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Ingrediente</h3>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 px-3 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 transition-all scale-95"
                  >
                    <Plus className="h-3 w-3" /> Adaugă Rând
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 dark:text-stone-500">Specificați cantitățile logic (ex: "250g făină", "1/2 linguriță chili").</p>

                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={ing}
                        onChange={(e) => handleIngredientChange(idx, e.target.value)}
                        placeholder={`Ingredient ${idx + 1}`}
                        className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-2 text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0 inline-flex items-center justify-center cursor-pointer"
                        title="Sterge ingredient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Instructions steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-50 dark:border-stone-800 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Etape Preparare</h3>
                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 px-3 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 transition-all scale-95"
                  >
                    <Plus className="h-3 w-3" /> Adaugă Pas
                  </button>
                </div>

                <div className="space-y-3">
                  {instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold text-xs shrink-0 mt-2">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={step}
                        onChange={(e) => handleInstructionChange(idx, e.target.value)}
                        placeholder={`Descrieți etapa ${idx + 1}...`}
                        className="flex-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-stone-500 text-stone-800 dark:text-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="p-2 text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0 mt-1 inline-flex items-center justify-center cursor-pointer"
                        title="Sterge pas"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form errors indicator */}
              {formErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 font-medium space-y-1">
                  <p className="text-xs font-semibold flex items-center gap-1.5 mb-1 text-rose-800 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4" />
                    Vă rugăm să rectificați erorile completate:
                  </p>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 font-normal">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submit panel buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-stone-50 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => { setActiveTab("list"); setEditingRecipe(null); }}
                  className="px-6 py-2 rounded-xl text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 dark:bg-stone-100 hover:bg-stone-900 dark:hover:bg-white text-white dark:text-stone-900 px-6 py-2.5 text-xs font-semibold shadow-md cursor-pointer transition-all active:scale-95"
                  id="admin-submit-btn"
                >
                  <Save className="h-4 w-4" />
                  {editingRecipe ? "Salvează Modificările" : "Salvează Rețeta Nouă"}
                </button>
              </div>
            </form>

            {/* Real-time Preview column (Span 5) */}
            <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#9d5c3d]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Previzualizare Live</h3>
              </div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 italic">Aceasta este reprezentarea exactă a cardului care va apărea în catalogul public:</p>
              
              <div className="max-w-[340px]">
                <RecipeCard
                  recipe={previewRecipeObj}
                  onViewDetails={() => {}}
                  onToggleFavorite={() => {}}
                />
              </div>

              {/* Little informative card */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed max-w-[340px]">
                <p>💡 Fotografiile adăugate trebuie să fie sub formă de link-uri valide directe (URL). Reprezentarea implicită (în lipsa unei imagini) va afișa un ecran de înlocuire estetic.</p>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
