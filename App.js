import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, Image,
  TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, Modal, Animated, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, Camera } from 'expo-camera';

const GOALS = [
  { id: 'healthy', emoji: '🥗', label: 'Eat healthier' },
  { id: 'money',   emoji: '💰', label: 'Save money' },
  { id: 'skills',  emoji: '🔪', label: 'Improve cooking skills' },
  { id: 'organize',emoji: '📦', label: 'Organize recipes' },
  { id: 'plan',    emoji: '📅', label: 'Plan out meals' },
  { id: 'cuisine', emoji: '🌍', label: 'Try new cuisines' },
];
const SOURCES = [
  { id: 'social',   emoji: '📱', label: 'Social media (Instagram, TikTok)' },
  { id: 'websites', emoji: '🌐', label: 'Recipe websites' },
  { id: 'friends',  emoji: '👨‍👩‍👧', label: 'Friends & family' },
  { id: 'books',    emoji: '📚', label: 'Cookbooks' },
];
const AGES = ['24 and under', '25–34', '35–44', '45–54', '55+'];
const HEARD = [
  { emoji: '📸', label: 'Instagram' },
  { emoji: '🎵', label: 'TikTok' },
  { emoji: '▶️', label: 'YouTube' },
  { emoji: '🍎', label: 'App Store' },
  { emoji: '👥', label: 'Through a friend' },
  { emoji: '🔍', label: 'Google Search' },
  { emoji: '❓', label: 'Other' },
];

function ProgressBar({ step, total }) {
  return (
    <View style={ob.progressBg}>
      <View style={[ob.progressFill, { width: `${(step / total) * 100}%` }]} />
    </View>
  );
}

function OnboardingWrapper({ step, total, onBack, onSkip, children, onContinue, continueLabel = 'Continue', continueDisabled = false }) {
  return (
    <View style={ob.wrapper}>
      <StatusBar style="dark" />
      <View style={ob.topRow}>
        <TouchableOpacity onPress={onBack} style={ob.backBtn}>
          <Text style={ob.backText}>‹</Text>
        </TouchableOpacity>
        <ProgressBar step={step} total={total} />
        {onSkip
          ? <TouchableOpacity onPress={onSkip}><Text style={ob.skipText}>Skip</Text></TouchableOpacity>
          : <View style={{ width: 40 }} />}
      </View>
      <ScrollView contentContainerStyle={ob.content}>{children}</ScrollView>
      <View style={ob.footer}>
        <TouchableOpacity
          style={[ob.continueBtn, continueDisabled && ob.continueBtnDisabled]}
          onPress={onContinue}
          disabled={continueDisabled}
        >
          <Text style={ob.continueBtnText}>{continueLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GoalsScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState([]);
  function toggle(id) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  return (
    <OnboardingWrapper step={1} total={6} onBack={onBack} onContinue={() => onNext(selected)} continueDisabled={selected.length === 0}>
      <Text style={ob.title}>What are your goals?</Text>
      <Text style={ob.subtitle}>Select all that apply</Text>
      {GOALS.map(g => (
        <TouchableOpacity key={g.id} style={[ob.option, selected.includes(g.id) && ob.optionSelected]} onPress={() => toggle(g.id)}>
          <Text style={ob.optionEmoji}>{g.emoji}</Text>
          <Text style={ob.optionLabel}>{g.label}</Text>
        </TouchableOpacity>
      ))}
    </OnboardingWrapper>
  );
}

function AffirmationScreen({ goals, onNext, onBack }) {
  const messages = {
    healthy: { title: "Let's eat better together! 🥗", body: "We'll help you find healthy recipes you'll actually want to cook." },
    money:   { title: "Smart cooking saves money! 💰", body: "92% of users report spending less on food after using Reel Meals." },
    skills:  { title: "Every cook starts somewhere! 🔪", body: "We'll help you level up your skills one recipe at a time." },
    organize:{ title: "No more lost recipes! 📦", body: "Keep all your recipes in one place, always at your fingertips." },
    plan:    { title: "Meal planning made easy! 📅", body: "Save time and stress by planning your week in advance." },
    cuisine: { title: "The world is your kitchen! 🌍", body: "Discover amazing dishes from every corner of the globe." },
  };
  const msg = messages[goals[0]] || messages.organize;
  return (
    <OnboardingWrapper step={2} total={6} onBack={onBack} onContinue={onNext}>
      <Text style={ob.title}>{msg.title}</Text>
      <Text style={ob.affirmBody}>{msg.body}</Text>
      <Text style={ob.affirmNote}>We're here to help you with your goals 🤝</Text>
    </OnboardingWrapper>
  );
}

function SourcesScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState([]);
  function toggle(id) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  return (
    <OnboardingWrapper step={3} total={6} onBack={onBack} onSkip={onNext} onContinue={() => onNext(selected)} continueDisabled={selected.length === 0}>
      <Text style={ob.title}>Where do you get your recipes from?</Text>
      <Text style={ob.subtitle}>Select all that apply</Text>
      {SOURCES.map(s => (
        <TouchableOpacity key={s.id} style={[ob.option, selected.includes(s.id) && ob.optionSelected]} onPress={() => toggle(s.id)}>
          <Text style={ob.optionEmoji}>{s.emoji}</Text>
          <Text style={ob.optionLabel}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </OnboardingWrapper>
  );
}

function AgeScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);
  return (
    <OnboardingWrapper step={4} total={6} onBack={onBack} onSkip={onNext} onContinue={() => onNext(selected)} continueDisabled={!selected}>
      <Text style={ob.title}>How old are you?</Text>
      <Text style={ob.subtitle}>We only use this to personalize your experience</Text>
      {AGES.map(a => (
        <TouchableOpacity key={a} style={[ob.option, selected === a && ob.optionSelected]} onPress={() => setSelected(a)}>
          <Text style={ob.optionLabel}>{a}</Text>
        </TouchableOpacity>
      ))}
    </OnboardingWrapper>
  );
}

function HeardScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);
  return (
    <OnboardingWrapper step={5} total={6} onBack={onBack} onSkip={onNext} onContinue={() => onNext(selected)} continueDisabled={!selected}>
      <Text style={ob.title}>How did you hear about us?</Text>
      {HEARD.map(h => (
        <TouchableOpacity key={h.label} style={[ob.option, selected === h.label && ob.optionSelected]} onPress={() => setSelected(h.label)}>
          <Text style={ob.optionEmoji}>{h.emoji}</Text>
          <Text style={ob.optionLabel}>{h.label}</Text>
        </TouchableOpacity>
      ))}
    </OnboardingWrapper>
  );
}

function ReadyScreen({ onDone, onBack }) {
  return (
    <OnboardingWrapper step={6} total={6} onBack={onBack} onContinue={onDone} continueLabel="Let's go! 🍳">
      <Text style={ob.title}>You're all set! 🎉</Text>
      <Text style={ob.affirmBody}>Paste an Instagram or TikTok link to extract your first recipe. It only takes a few seconds.</Text>
      <View style={ob.featureList}>
        {['📱 Instagram & TikTok Reels', '💾 Save your favorite recipes', '⚖️ Scale servings instantly', '▶️ Watch the original video', '📷 Scan printed recipes', '📚 Organize into cookbooks'].map(f => (
          <Text key={f} style={ob.featureItem}>{f}</Text>
        ))}
      </View>
    </OnboardingWrapper>
  );
}

function getIngredientEmoji(item) {
  const name = item.toLowerCase();
  if (name.includes('chicken')) return '🍗';
  if (name.includes('beef') || name.includes('steak')) return '🥩';
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) return '🐟';
  if (name.includes('egg')) return '🥚';
  if (name.includes('milk') || name.includes('cream')) return '🥛';
  if (name.includes('cheese')) return '🧀';
  if (name.includes('butter')) return '🧈';
  if (name.includes('flour')) return '🌾';
  if (name.includes('sugar')) return '🍬';
  if (name.includes('salt')) return '🧂';
  if (name.includes('oil') || name.includes('olive')) return '🫙';
  if (name.includes('garlic')) return '🧄';
  if (name.includes('onion')) return '🧅';
  if (name.includes('tomato')) return '🍅';
  if (name.includes('lemon') || name.includes('lime')) return '🍋';
  if (name.includes('carrot')) return '🥕';
  if (name.includes('potato')) return '🥔';
  if (name.includes('pepper')) return '🌶️';
  if (name.includes('mushroom')) return '🍄';
  if (name.includes('avocado')) return '🥑';
  if (name.includes('spinach') || name.includes('lettuce')) return '🥬';
  if (name.includes('broccoli')) return '🥦';
  if (name.includes('rice')) return '🍚';
  if (name.includes('pasta') || name.includes('noodle')) return '🍝';
  if (name.includes('bread')) return '🍞';
  if (name.includes('apple')) return '🍎';
  if (name.includes('banana')) return '🍌';
  if (name.includes('water')) return '💧';
  if (name.includes('wine')) return '🍷';
  if (name.includes('beer')) return '🍺';
  if (name.includes('honey')) return '🍯';
  if (name.includes('ginger')) return '🫚';
  if (name.includes('cilantro') || name.includes('parsley') || name.includes('herb')) return '🌿';
  return '🥄';
}

// ─── Grocery Screen ───────────────────────────────────────────────────────────
function GroceryScreen() {
  const [items, setItems] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    async function load() {
      const json = await AsyncStorage.getItem('grocery_list');
      if (json) setItems(JSON.parse(json));
    }
    load();
  }, []);

  async function toggleItem(id) {
    const updated = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setItems(updated);
    await AsyncStorage.setItem('grocery_list', JSON.stringify(updated));
  }

  async function removeMeal(mealName) {
    const updated = items.filter(i => i.recipe !== mealName);
    setItems(updated);
    await AsyncStorage.setItem('grocery_list', JSON.stringify(updated));
    setSelectedMeal(null);
  }

  async function clearAll() {
    Alert.alert('Clear all?', 'Remove all items from your grocery list?', [
      { text: 'Clear All', style: 'destructive', onPress: async () => {
        setItems([]);
        await AsyncStorage.setItem('grocery_list', JSON.stringify([]));
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const meals = [...new Set(items.map(i => i.recipe))];

  if (selectedMeal) {
    const mealItems = items.filter(i => i.recipe === selectedMeal);
    const checkedCount = mealItems.filter(i => i.checked).length;
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <TouchableOpacity onPress={() => setSelectedMeal(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 }}>
            <Text style={{ fontSize: 20, color: '#7c3aed' }}>‹</Text>
            <Text style={{ fontSize: 15, color: '#7c3aed', fontWeight: '600' }}>All Meals</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>{selectedMeal}</Text>
            <TouchableOpacity onPress={() => removeMeal(selectedMeal)}>
              <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Remove meal</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>{checkedCount} of {mealItems.length} items checked</Text>
          {mealItems.map(item => (
            <TouchableOpacity key={item.id} style={gr.item} onPress={() => toggleItem(item.id)}>
              <View style={[gr.checkbox, item.checked && gr.checkboxChecked]}>
                {item.checked && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gr.itemName, item.checked && gr.itemNameChecked]}>
                  {item.amount} {item.unit} {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>🛒 Grocery List</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>No meals yet</Text>
          <Text style={styles.emptySubtitle}>Open a recipe and tap "Add to groceries" to add ingredients here</Text>
        </View>
      ) : (
        meals.map(meal => {
          const mealItems = items.filter(i => i.recipe === meal);
          const checkedCount = mealItems.filter(i => i.checked).length;
          const allChecked = checkedCount === mealItems.length;
          return (
            <TouchableOpacity key={meal} style={gr.mealCard} onPress={() => setSelectedMeal(meal)}>
              <View style={{ flex: 1 }}>
                <Text style={[gr.mealName, allChecked && gr.itemNameChecked]}>{meal}</Text>
                <Text style={gr.mealMeta}>{checkedCount}/{mealItems.length} items checked</Text>
              </View>
              <View style={gr.mealProgress}>
                <View style={[gr.mealProgressFill, { width: `${(checkedCount / mealItems.length) * 100}%` }]} />
              </View>
              <Text style={{ fontSize: 20, color: '#ccc' }}>›</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Meal Plan Screen ─────────────────────────────────────────────────────────
function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
}

function MealPlanScreen({ saved }) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MEALS = ['Breakfast', 'Lunch', 'Dinner'];
  const [plan, setPlan] = useState({});
  const [picking, setPicking] = useState(null);

  useEffect(() => {
    async function load() {
      const json = await AsyncStorage.getItem('meal_plan');
      const weekKey = await AsyncStorage.getItem('meal_plan_week');
      const currentWeek = getWeekNumber();
      if (weekKey !== String(currentWeek)) {
        await AsyncStorage.setItem('meal_plan', JSON.stringify({}));
        await AsyncStorage.setItem('meal_plan_week', String(currentWeek));
        setPlan({});
      } else if (json) {
        setPlan(JSON.parse(json));
      }
    }
    load();
  }, []);

  async function assignRecipe(recipe) {
    const key = `${picking.day}-${picking.meal}`;
    const updated = { ...plan, [key]: recipe };
    setPlan(updated);
    await AsyncStorage.setItem('meal_plan', JSON.stringify(updated));
    setPicking(null);
  }

  async function removeRecipe(day, meal) {
    const key = `${day}-${meal}`;
    const updated = { ...plan };
    delete updated[key];
    setPlan(updated);
    await AsyncStorage.setItem('meal_plan', JSON.stringify(updated));
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={styles.headerTitle}>Meal Plan</Text>
        <Text style={{ color: '#888', marginBottom: 16, fontSize: 13 }}>Tap a slot to assign a recipe</Text>
        {DAYS.map(day => (
          <View key={day} style={mp.dayBlock}>
            <Text style={mp.dayLabel}>{day}</Text>
            {MEALS.map(meal => {
              const key = `${day}-${meal}`;
              const assigned = plan[key];
              return (
                <TouchableOpacity
                  key={meal}
                  style={[mp.slot, assigned && mp.slotFilled]}
                  onPress={() => {
                    if (assigned) {
                      Alert.alert(assigned.dish, 'What would you like to do?', [
                        { text: 'Change Recipe', onPress: () => setPicking({ day, meal }) },
                        { text: 'Remove', style: 'destructive', onPress: () => removeRecipe(day, meal) },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    } else {
                      setPicking({ day, meal });
                    }
                  }}
                >
                  <Text style={mp.mealLabel}>{meal}</Text>
                  {assigned ? (
                    <Text style={mp.assignedRecipe} numberOfLines={1}>{assigned.dish}</Text>
                  ) : (
                    <Text style={mp.addLabel}>+ Add</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!picking} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <View style={mp.modalOverlay}>
          <View style={mp.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={mp.modalTitle}>{picking?.meal} on {picking?.day}</Text>
            <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Choose from your saved recipes</Text>
            {saved.length === 0 ? (
              <Text style={{ color: '#999', textAlign: 'center', padding: 20 }}>No saved recipes yet!</Text>
            ) : (
              <ScrollView>
                {saved.map(r => (
                  <TouchableOpacity key={r.id} style={mp.recipeOption} onPress={() => assignRecipe(r)}>
                    <Text style={mp.recipeOptionName}>{r.dish}</Text>
                    <Text style={mp.recipeOptionMeta}>⏱ {r.prep_time} · 🍽 Serves {r.servings}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={mp.cancelBtn} onPress={() => setPicking(null)}>
              <Text style={mp.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Macros Screen ────────────────────────────────────────────────────────────
function MacrosScreen({ saved }) {
  const today = new Date().toDateString();
  const [log, setLog] = useState([]);
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [showGoals, setShowGoals] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [tempGoals, setTempGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servingSize, setServingSize] = useState('1');
  const [scanned, setScanned] = useState(false);
  const scannedRef = useRef(false);
  const [suggestions, setSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [foodQuery, setFoodQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingFood, setSearchingFood] = useState(false);

  useEffect(() => {
    async function load() {
      const logJson = await AsyncStorage.getItem(`macro_log_${today}`);
      if (logJson) setLog(JSON.parse(logJson));
      const goalsJson = await AsyncStorage.getItem('macro_goals');
      if (goalsJson) {
        const saved_goals = JSON.parse(goalsJson);
        setGoals(saved_goals);
        setTempGoals(saved_goals);
      }
    }
    load();
  }, []);

  async function logMeal() {
    if (!selectedRecipe) return;
    if (!selectedRecipe.nutrition) {
      Alert.alert('No nutrition data', 'This recipe was saved before nutrition tracking was added. Re-extract it to get macros.');
      return;
    }
    const servings = parseFloat(servingSize) || 1;
    const entry = {
      id: Date.now() + Math.random(),
      name: selectedRecipe.dish,
      servings,
      calories: Math.round(selectedRecipe.nutrition.calories * servings),
      protein: Math.round(selectedRecipe.nutrition.protein * servings),
      carbs: Math.round(selectedRecipe.nutrition.carbs * servings),
      fat: Math.round(selectedRecipe.nutrition.fat * servings),
    };
    const updated = [...log, entry];
    setLog(updated);
    await AsyncStorage.setItem(`macro_log_${today}`, JSON.stringify(updated));
    setShowAddMeal(false);
    setSelectedRecipe(null);
    setServingSize('1');
  }

  async function removeEntry(id) {
    const updated = log.filter(e => e.id !== id);
    setLog(updated);
    await AsyncStorage.setItem(`macro_log_${today}`, JSON.stringify(updated));
  }

  async function saveGoals() {
    const newGoals = {
      calories: parseInt(tempGoals.calories) || 2000,
      protein: parseInt(tempGoals.protein) || 150,
      carbs: parseInt(tempGoals.carbs) || 200,
      fat: parseInt(tempGoals.fat) || 65,
    };
    await AsyncStorage.setItem('macro_goals', JSON.stringify(newGoals));
    setGoals(newGoals);
    setTempGoals(newGoals);
    setShowGoals(false);
    Alert.alert('Saved!', 'Your daily goals have been updated.');
  }

  const totals = log.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein: acc.protein + e.protein,
    carbs: acc.carbs + e.carbs,
    fat: acc.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  async function suggestSnacks() {
    const remaining = {
      calories: goals.calories - totals.calories,
      protein: goals.protein - totals.protein,
      carbs: goals.carbs - totals.carbs,
      fat: goals.fat - totals.fat,
    };
    if (remaining.calories <= 0) {
      Alert.alert('Goal reached!', "You've already hit your calorie goal for today!");
      return;
    }
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    setSuggestions('');
    try {
      const res = await fetch('https://web-production-70819.up.railway.app/api/suggest-snacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remaining }),
      });
      const data = await res.json();
      setSuggestions(data.text);
    } catch (e) {
      setSuggestions('Could not load suggestions. Try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function searchFood() {
    if (!foodQuery.trim()) return;
    setSearchingFood(true);
    setSearchResults([]);
    try {
      const res = await fetch('https://web-production-70819.up.railway.app/api/search-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: foodQuery }),
      });
      const data = await res.json();
      const raw = data.text;
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']') + 1;
      const results = JSON.parse(raw.slice(start, end));
      setSearchResults(results);
    } catch (e) {
      Alert.alert('Error', 'Could not search for food. Try again.');
    } finally {
      setSearchingFood(false);
    }
  }

  async function logFoodResult(item) {
    const entry = {
      id: Date.now() + Math.random(),
      name: `${item.name} (${item.serving})`,
      servings: 1,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    };
    const updated = [...log, entry];
    setLog(updated);
    await AsyncStorage.setItem(`macro_log_${today}`, JSON.stringify(updated));
    setShowFoodSearch(false);
    setFoodQuery('');
    setSearchResults([]);
    Alert.alert('Added! ✅', `${item.name} added to your log.`);
  }

  async function openScanner() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      scannedRef.current = false;
      setScanned(false);
      setShowScanner(true);
    } else {
      Alert.alert('Permission needed', 'Please allow camera access to scan barcodes.');
    }
  }

  async function handleBarcodeScan({ data }) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanned(true);
    setShowScanner(false);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`, {
        headers: { 'User-Agent': 'ReelMeals - iOS - Version 1.0' }
      });
      if (!res.ok) {
        Alert.alert('Error', 'Could not reach food database. Try again.');
        scannedRef.current = false;
        setScanned(false);
        return;
      }
      const json = await res.json();
      if (json.status !== 1 || !json.product) {
        Alert.alert('Not found', 'This barcode was not found. Try scanning again.');
        scannedRef.current = false;
        setScanned(false);
        return;
      }
      const product = json.product;
      const nutrients = product.nutriments || {};
      const entry = {
        id: Date.now(),
        name: product.product_name || 'Unknown product',
        servings: 1,
        calories: Math.round(nutrients['energy-kcal_serving'] || nutrients['energy-kcal_100g'] || 0),
        protein: Math.round(nutrients['proteins_serving'] || nutrients['proteins_100g'] || 0),
        carbs: Math.round(nutrients['carbohydrates_serving'] || nutrients['carbohydrates_100g'] || 0),
        fat: Math.round(nutrients['fat_serving'] || nutrients['fat_100g'] || 0),
      };
      const updated = [...log, entry];
      setLog(updated);
      await AsyncStorage.setItem(`macro_log_${today}`, JSON.stringify(updated));
      scannedRef.current = false;
      setScanned(false);
      Alert.alert('Added! ✅', `${entry.name} added to your log.\n${entry.calories} cal · ${entry.protein}g P · ${entry.carbs}g C · ${entry.fat}g F`);
    } catch (e) {
      Alert.alert('Error', 'Could not look up this product. Try again.');
      scannedRef.current = false;
      setScanned(false);
    }
  }

  function MacroBar({ label, current, goal, color }) {
    const pct = Math.min((current / goal) * 100, 100);
    return (
      <View style={mac.barRow}>
        <View style={mac.barLabelRow}>
          <Text style={mac.barLabel}>{label}</Text>
          <Text style={mac.barValues}>{current}g / {goal}g</Text>
        </View>
        <View style={mac.barBg}>
          <View style={[mac.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={mac.header}>
          <Text style={mac.title}>Daily Macros</Text>
          <TouchableOpacity onPress={() => { setTempGoals({...goals}); setShowGoals(true); }}>
            <Text style={mac.settingsBtn}>⚙️ Goals</Text>
          </TouchableOpacity>
        </View>

        <View style={mac.calorieCard}>
          <View style={mac.calorieMain}>
            <Text style={mac.calorieNumber}>{totals.calories}</Text>
            <Text style={mac.calorieLabel}>eaten</Text>
          </View>
          <View style={mac.calorieDivider} />
          <View style={mac.calorieMain}>
            <Text style={[mac.calorieNumber, { color: goals.calories - totals.calories < 0 ? '#ef4444' : '#22c55e' }]}>
              {Math.abs(goals.calories - totals.calories)}
            </Text>
            <Text style={mac.calorieLabel}>{goals.calories - totals.calories < 0 ? 'over' : 'remaining'}</Text>
          </View>
          <View style={mac.calorieDivider} />
          <View style={mac.calorieMain}>
            <Text style={mac.calorieNumber}>{goals.calories}</Text>
            <Text style={mac.calorieLabel}>goal</Text>
          </View>
        </View>

        <View style={mac.barsCard}>
          <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color="#7c3aed" />
          <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color="#f59e0b" />
          <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color="#ef4444" />
        </View>

        <TouchableOpacity style={mac.groceryBtn} onPress={() => setShowGrocery(true)}>
          <Text style={mac.groceryBtnText}>🛒 Grocery List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={mac.addMealBtn} onPress={() => setShowAddMeal(true)}>
          <Text style={mac.addMealBtnText}>+ Log a Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={mac.scanBtn} onPress={openScanner}>
          <Text style={mac.scanBtnText}>📷 Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={mac.suggestBtn} onPress={suggestSnacks}>
          <Text style={mac.suggestBtnText}>✨ Suggest Snacks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={mac.searchBtn} onPress={() => setShowFoodSearch(true)}>
          <Text style={mac.searchBtnText}>🔍 Search Food</Text>
        </TouchableOpacity>

        {log.length > 0 && (
          <>
            <Text style={mac.sectionLabel}>Today's Log</Text>
            {log.map(entry => (
              <View key={entry.id} style={mac.logEntry}>
                <View style={{ flex: 1 }}>
                  <Text style={mac.logName}>{entry.name}{entry.servings !== 1 ? ` (${entry.servings} servings)` : ''}</Text>
                  <Text style={mac.logMacros}>{entry.calories} cal · {entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat</Text>
                </View>
                <TouchableOpacity onPress={() => removeEntry(entry.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={mac.logDelete}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {log.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptySubtitle}>Tap "Log a Meal" to add from your saved recipes</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showGrocery} transparent animationType="slide" onRequestClose={() => setShowGrocery(false)}>
        <View style={{ flex: 1, backgroundColor: '#f5f5f0', marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>🛒 Grocery List</Text>
            <TouchableOpacity onPress={() => setShowGrocery(false)}>
              <Text style={{ fontSize: 16, color: '#7c3aed', fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
          <GroceryScreen />
        </View>
      </Modal>

      <Modal visible={showFoodSearch} transparent animationType="slide" onRequestClose={() => setShowFoodSearch(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={mac.modalOverlay}>
            <View style={mac.modalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={mac.modalTitle}>🔍 Search Food</Text>
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>Search any food or restaurant item</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput
                  style={[mac.goalInput, { flex: 1, width: 'auto', textAlign: 'left', paddingHorizontal: 14 }]}
                  placeholder="e.g. Chipotle chicken burrito bowl"
                  placeholderTextColor="#aaa"
                  value={foodQuery}
                  onChangeText={setFoodQuery}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={searchFood}
                />
                <TouchableOpacity
                  style={[mac.saveGoalsBtn, { margin: 0, paddingHorizontal: 16 }]}
                  onPress={searchFood}
                  disabled={searchingFood}
                >
                  <Text style={mac.saveGoalsBtnText}>{searchingFood ? '...' : 'Search'}</Text>
                </TouchableOpacity>
              </View>
              {searchingFood && (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text style={{ color: '#888', marginTop: 8 }}>Looking up nutrition data...</Text>
                </View>
              )}
              {searchResults.length > 0 && (
                <ScrollView>
                  {searchResults.map((item, i) => (
                    <TouchableOpacity key={i} style={mac.recipeOption} onPress={() => logFoodResult(item)}>
                      <View style={{ flex: 1 }}>
                        <Text style={mac.recipeOptionName}>{item.name}</Text>
                        <Text style={{ fontSize: 11, color: '#bbb', marginBottom: 4 }}>{item.serving}</Text>
                        <Text style={mac.recipeOptionMacros}>
                          {item.calories} cal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                        </Text>
                      </View>
                      <Text style={mac.logAddBtn}>+ Add</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity style={mac.cancelBtn} onPress={() => { setShowFoodSearch(false); setFoodQuery(''); setSearchResults([]); }}>
                <Text style={mac.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showSuggestions} transparent animationType="slide" onRequestClose={() => setShowSuggestions(false)}>
        <View style={mac.modalOverlay}>
          <View style={mac.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={mac.modalTitle}>✨ Snack Suggestions</Text>
            <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
              Based on your remaining {goals.calories - totals.calories} calories today
            </Text>
            {loadingSuggestions ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={{ color: '#888', marginTop: 12 }}>Finding perfect snacks...</Text>
              </View>
            ) : (
              <ScrollView>
                <Text style={{ fontSize: 14, lineHeight: 24, color: '#333' }}>{suggestions}</Text>
              </ScrollView>
            )}
            <TouchableOpacity style={mac.cancelBtn} onPress={() => setShowSuggestions(false)}>
              <Text style={mac.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showScanner} transparent animationType="slide" onRequestClose={() => { setShowScanner(false); scannedRef.current = false; setScanned(false); }}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            style={{ flex: 1 }}
          />
          <View style={mac.scannerOverlay}>
            <View style={mac.scannerBox} />
            <Text style={mac.scannerHint}>Point at a barcode to scan</Text>
            <TouchableOpacity style={mac.scannerCancel} onPress={() => { setShowScanner(false); scannedRef.current = false; setScanned(false); }}>
              <Text style={mac.scannerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddMeal} transparent animationType="slide" onRequestClose={() => { setShowAddMeal(false); setSelectedRecipe(null); setServingSize('1'); }}>
        <View style={mac.modalOverlay}>
          <View style={mac.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={mac.modalTitle}>Log a Meal</Text>
            {!selectedRecipe ? (
              <>
                <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Choose from your saved recipes</Text>
                {saved.filter(r => r.nutrition).length === 0 ? (
                  <Text style={{ color: '#999', textAlign: 'center', padding: 20 }}>No recipes with nutrition data yet. Extract a new recipe to get macros!</Text>
                ) : (
                  <ScrollView>
                    {saved.filter(r => r.nutrition).map(r => (
                      <TouchableOpacity key={r.id} style={mac.recipeOption} onPress={() => setSelectedRecipe(r)}>
                        <View style={{ flex: 1 }}>
                          <Text style={mac.recipeOptionName}>{r.dish}</Text>
                          <Text style={mac.recipeOptionMacros}>
                            {r.nutrition.calories} cal · {r.nutrition.protein}g P · {r.nutrition.carbs}g C · {r.nutrition.fat}g F
                          </Text>
                        </View>
                        <Text style={mac.logAddBtn}>Select →</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity style={mac.cancelBtn} onPress={() => setShowAddMeal(false)}>
                  <Text style={mac.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={mac.selectedRecipeName}>{selectedRecipe.dish}</Text>
                <Text style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
                  Per serving: {selectedRecipe.nutrition.calories} cal · {selectedRecipe.nutrition.protein}g P · {selectedRecipe.nutrition.carbs}g C · {selectedRecipe.nutrition.fat}g F
                </Text>
                <Text style={mac.goalLabel}>Number of servings</Text>
                <View style={mac.servingRow}>
                  <TouchableOpacity style={mac.servingBtn} onPress={() => setServingSize(s => String(Math.max(0.25, parseFloat(s) - 0.25)))}>
                    <Text style={mac.servingBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={mac.servingInput}
                    value={servingSize}
                    onChangeText={setServingSize}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity style={mac.servingBtn} onPress={() => setServingSize(s => String(parseFloat(s) + 0.25))}>
                    <Text style={mac.servingBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={mac.nutritionPreview}>
                  <Text style={mac.nutritionPreviewText}>
                    Total: {Math.round(selectedRecipe.nutrition.calories * (parseFloat(servingSize) || 1))} cal · {Math.round(selectedRecipe.nutrition.protein * (parseFloat(servingSize) || 1))}g P · {Math.round(selectedRecipe.nutrition.carbs * (parseFloat(servingSize) || 1))}g C · {Math.round(selectedRecipe.nutrition.fat * (parseFloat(servingSize) || 1))}g F
                  </Text>
                </View>
                <TouchableOpacity style={mac.saveGoalsBtn} onPress={logMeal}>
                  <Text style={mac.saveGoalsBtnText}>Add to Log</Text>
                </TouchableOpacity>
                <TouchableOpacity style={mac.cancelBtn} onPress={() => setSelectedRecipe(null)}>
                  <Text style={mac.cancelBtnText}>← Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showGoals} transparent animationType="slide" onRequestClose={() => setShowGoals(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={mac.modalOverlay}>
            <View style={mac.modalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={mac.modalTitle}>Daily Goals</Text>

              <View style={mac.goalRow}>
                <Text style={mac.goalLabel}>Calories (kcal)</Text>
                <TextInput
                  style={mac.goalInput}
                  value={String(tempGoals.calories || '')}
                  onChangeText={v => {
                    const cal = parseInt(v) || 0;
                    const p = tempGoals.proteinPct || 30;
                    const c = tempGoals.carbsPct || 40;
                    const f = tempGoals.fatPct || 30;
                    setTempGoals(g => ({
                      ...g,
                      calories: cal,
                      protein: Math.round((cal * p / 100) / 4),
                      carbs: Math.round((cal * c / 100) / 4),
                      fat: Math.round((cal * f / 100) / 9),
                    }));
                  }}
                  keyboardType="numeric"
                />
              </View>

              <Text style={[mac.goalLabel, { marginBottom: 8, marginTop: 8 }]}>Macro Split</Text>

              {[
                { key: 'proteinPct', label: 'Protein', color: '#7c3aed', calsPerG: 4 },
                { key: 'carbsPct', label: 'Carbs', color: '#f59e0b', calsPerG: 4 },
                { key: 'fatPct', label: 'Fat', color: '#ef4444', calsPerG: 9 },
              ].map(({ key, label, color, calsPerG }) => {
                const pct = tempGoals[key] || (key === 'proteinPct' ? 30 : key === 'carbsPct' ? 40 : 30);
                const grams = Math.round(((tempGoals.calories || 2000) * pct / 100) / calsPerG);
                return (
                  <View key={key} style={{ marginBottom: 12 }}>
                    <View style={mac.goalRow}>
                      <Text style={[mac.goalLabel, { color }]}>{label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          style={mac.pctBtn}
                          onPress={() => {
                            const newPct = Math.max(5, pct - 5);
                            const cal = tempGoals.calories || 2000;
                            setTempGoals(g => ({
                              ...g,
                              [key]: newPct,
                              protein: Math.round((cal * (key === 'proteinPct' ? newPct : g.proteinPct || 30) / 100) / 4),
                              carbs: Math.round((cal * (key === 'carbsPct' ? newPct : g.carbsPct || 40) / 100) / 4),
                              fat: Math.round((cal * (key === 'fatPct' ? newPct : g.fatPct || 30) / 100) / 9),
                            }));
                          }}
                        >
                          <Text style={mac.pctBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={[mac.pctValue, { color }]}>{pct}%</Text>
                        <TouchableOpacity
                          style={mac.pctBtn}
                          onPress={() => {
                            const newPct = Math.min(80, pct + 5);
                            const cal = tempGoals.calories || 2000;
                            setTempGoals(g => ({
                              ...g,
                              [key]: newPct,
                              protein: Math.round((cal * (key === 'proteinPct' ? newPct : g.proteinPct || 30) / 100) / 4),
                              carbs: Math.round((cal * (key === 'carbsPct' ? newPct : g.carbsPct || 40) / 100) / 4),
                              fat: Math.round((cal * (key === 'fatPct' ? newPct : g.fatPct || 30) / 100) / 9),
                            }));
                          }}
                        >
                          <Text style={mac.pctBtnText}>+</Text>
                        </TouchableOpacity>
                        <Text style={mac.gramsValue}>{grams}g</Text>
                      </View>
                    </View>
                    <View style={mac.barBg}>
                      <View style={[mac.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}

              {(() => {
                const total = (tempGoals.proteinPct || 30) + (tempGoals.carbsPct || 40) + (tempGoals.fatPct || 30);
                return (
                  <View style={[mac.totalPct, { backgroundColor: total === 100 ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[mac.totalPctText, { color: total === 100 ? '#16a34a' : '#dc2626' }]}>
                      {total === 100 ? '✅ Total: 100%' : `⚠️ Total: ${total}% (must equal 100%)`}
                    </Text>
                  </View>
                );
              })()}

              <TouchableOpacity
                style={[mac.saveGoalsBtn, ((tempGoals.proteinPct || 30) + (tempGoals.carbsPct || 40) + (tempGoals.fatPct || 30)) !== 100 && { backgroundColor: '#c4b5fd' }]}
                onPress={saveGoals}
                disabled={((tempGoals.proteinPct || 30) + (tempGoals.carbsPct || 40) + (tempGoals.fatPct || 30)) !== 100}
              >
                <Text style={mac.saveGoalsBtnText}>Save Goals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={mac.cancelBtn} onPress={() => setShowGoals(false)}>
                <Text style={mac.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Discover Screen ──────────────────────────────────────────────────────────
function DiscoverScreen({ onSaveRecipe }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [viewing, setViewing] = useState(null);

  const filters = [
    { id: 'quick', label: '⚡ < 15 min' },
    { id: 'easy', label: '😊 Easy' },
    { id: 'healthy', label: '🥗 Healthy' },
    { id: 'highprotein', label: '💪 High Protein' },
    { id: 'breakfast', label: '🌅 Breakfast' },
    { id: 'dinner', label: '🌙 Dinner' },
  ];

  useEffect(() => {
    loadRecipes(null);
  }, []);

  async function loadRecipes(filter) {
    setLoading(true);
    setRecipes([]);
    setActiveFilter(filter);
    try {
      const filterText = filter ? `Focus on ${filter} recipes.` : 'Mix of different cuisines and meal types.';
      const res = await fetch('https://web-production-70819.up.railway.app/api/discover-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: filter }),
      });
      const data = await res.json();
      const raw = data.text;
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']') + 1;
      if (start === -1 || end === 0) throw new Error('No JSON array found in response');
      const trimmed = raw.slice(start, end);
      const results = JSON.parse(trimmed);
      setRecipes(results.map(r => ({ ...r, id: Date.now() + Math.random() })));
    } catch (e) {
      console.log('Discover error:', JSON.stringify(e));
      Alert.alert('Error', e.message || 'Could not load recipes. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (viewing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={disc.heroPlaceholder}>
            <Text style={disc.heroEmoji}>{viewing.emoji}</Text>
            <TouchableOpacity style={disc.backBtn} onPress={() => setViewing(null)}>
              <Text style={disc.backBtnText}>‹</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <View style={disc.tagRow}>
              <Text style={disc.tag}>{viewing.cuisine}</Text>
              <Text style={disc.tag}>{viewing.difficulty}</Text>
              <Text style={disc.tag}>⏱ {viewing.prep_time}</Text>
            </View>
            <Text style={disc.detailTitle}>{viewing.dish}</Text>
            <Text style={disc.detailDesc}>{viewing.description}</Text>
            <View style={disc.metaRow}>
              <View style={disc.metaItem}>
                <Text style={disc.metaValue}>{viewing.prep_time}</Text>
                <Text style={disc.metaLabel}>PREP</Text>
              </View>
              <View style={disc.metaDivider} />
              <View style={disc.metaItem}>
                <Text style={disc.metaValue}>{viewing.cook_time}</Text>
                <Text style={disc.metaLabel}>COOK</Text>
              </View>
              <View style={disc.metaDivider} />
              <View style={disc.metaItem}>
                <Text style={disc.metaValue}>{viewing.servings}</Text>
                <Text style={disc.metaLabel}>SERVES</Text>
              </View>
            </View>
            {viewing.nutrition && (
              <View style={disc.nutritionRow}>
                <View style={disc.nutritionItem}>
                  <Text style={disc.nutritionValue}>{viewing.nutrition.calories}</Text>
                  <Text style={disc.nutritionLabel}>Cal</Text>
                </View>
                <View style={disc.nutritionItem}>
                  <Text style={disc.nutritionValue}>{viewing.nutrition.protein}g</Text>
                  <Text style={disc.nutritionLabel}>Protein</Text>
                </View>
                <View style={disc.nutritionItem}>
                  <Text style={disc.nutritionValue}>{viewing.nutrition.carbs}g</Text>
                  <Text style={disc.nutritionLabel}>Carbs</Text>
                </View>
                <View style={disc.nutritionItem}>
                  <Text style={disc.nutritionValue}>{viewing.nutrition.fat}g</Text>
                  <Text style={disc.nutritionLabel}>Fat</Text>
                </View>
              </View>
            )}
            <Text style={disc.sectionTitle}>INGREDIENTS</Text>
            {viewing.ingredients?.map((ing, i) => (
              <View key={i} style={disc.ingredientRow}>
                <Text style={disc.ingredientEmoji}>{getIngredientEmoji(ing.item)}</Text>
                <Text style={disc.ingredientText}>
                  <Text style={disc.ingredientAmount}>{ing.amount} {ing.unit} </Text>
                  {ing.item}
                </Text>
              </View>
            ))}
            <Text style={disc.sectionTitle}>INSTRUCTIONS</Text>
            {viewing.steps?.map((step, i) => (
              <View key={i} style={disc.stepRow}>
                <Text style={disc.stepNum}>{i + 1}</Text>
                <Text style={disc.stepDesc}>{step}</Text>
              </View>
            ))}
            {viewing.tips?.length > 0 && (
              <>
                <Text style={disc.sectionTitle}>TIPS</Text>
                {viewing.tips.map((tip, i) => (
                  <Text key={i} style={{ fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 6 }}>• {tip}</Text>
                ))}
              </>
            )}
            <TouchableOpacity style={disc.saveBtn} onPress={() => { onSaveRecipe(viewing); setViewing(null); }}>
              <Text style={disc.saveBtnText}>🔖 Save to My Recipes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={disc.title}>Discover 🧭</Text>
        <Text style={disc.subtitle}>Browse AI-curated recipes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[disc.filterChip, activeFilter === f.id && disc.filterChipActive]}
              onPress={() => loadRecipes(activeFilter === f.id ? null : f.id)}
            >
              <Text style={[disc.filterChipText, activeFilter === f.id && disc.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={disc.refreshBtn} onPress={() => loadRecipes(activeFilter)}>
          <Text style={disc.refreshBtnText}>🔄 Load New Recipes</Text>
        </TouchableOpacity>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={{ color: '#888', marginTop: 12, fontSize: 14 }}>Curating recipes for you...</Text>
          </View>
        ) : (
          <View style={disc.grid}>
            {recipes.map(r => (
              <TouchableOpacity key={r.id} style={disc.card} onPress={() => setViewing(r)}>
                <View style={disc.cardImage}>
                  <Text style={disc.cardEmoji}>{r.emoji}</Text>
                  <View style={disc.cardTagRow}>
                    <Text style={disc.cardTag}>{r.difficulty}</Text>
                  </View>
                </View>
                <View style={disc.cardBody}>
                  <Text style={disc.cardTitle} numberOfLines={2}>{r.dish}</Text>
                  <Text style={disc.cardMeta}>⏱ {r.prep_time} · {r.cuisine}</Text>
                  {r.nutrition && <Text style={disc.cardCals}>{r.nutrition.calories} cal</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [onboarded, setOnboarded] = useState(null);
  const [obStep, setObStep] = useState(0);
  const [obGoals, setObGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('recipes');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [saved, setSaved] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [cookbooks, setCookbooks] = useState([]);
  const [activeCookbook, setActiveCookbook] = useState(null);
  const [showNewCookbook, setShowNewCookbook] = useState(false);
  const [newCookbookName, setNewCookbookName] = useState('');
  const [showWriteFromScratch, setShowWriteFromScratch] = useState(false);
  const [scratchIdea, setScratchIdea] = useState('');
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    async function init() {
      const done = await AsyncStorage.getItem('onboarded');
      setOnboarded(!!done);
      const json = await AsyncStorage.getItem('saved_recipes');
      if (json) setSaved(JSON.parse(json));
      const cb = await AsyncStorage.getItem('cookbooks');
      if (cb) setCookbooks(JSON.parse(cb));
    }
    init();
  }, []);

  function openSheet() {
    setShowAddSheet(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  }

  function closeSheet() {
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      setShowAddSheet(false);
      setShowUrlInput(false);
    });
  }

  async function finishOnboarding() {
    await AsyncStorage.setItem('onboarded', 'true');
    setOnboarded(true);
  }

  async function saveRecipe(r) {
    const updated = [{ ...r, id: Date.now() }, ...saved];
    setSaved(updated);
    await AsyncStorage.setItem('saved_recipes', JSON.stringify(updated));
    Alert.alert('Saved!', `${r.dish} has been saved.`);
  }

  async function deleteRecipe(id) {
    const updated = saved.filter(r => r.id !== id);
    setSaved(updated);
    await AsyncStorage.setItem('saved_recipes', JSON.stringify(updated));
  }

  async function createCookbook() {
    if (!newCookbookName.trim()) return;
    const updated = [...cookbooks, { id: Date.now(), name: newCookbookName.trim() }];
    setCookbooks(updated);
    await AsyncStorage.setItem('cookbooks', JSON.stringify(updated));
    setNewCookbookName('');
    setShowNewCookbook(false);
  }

  async function deleteCookbook(id) {
    const updated = cookbooks.filter(c => c.id !== id);
    setCookbooks(updated);
    await AsyncStorage.setItem('cookbooks', JSON.stringify(updated));
    const updatedRecipes = saved.map(r => r.cookbookId === id ? { ...r, cookbookId: null } : r);
    setSaved(updatedRecipes);
    await AsyncStorage.setItem('saved_recipes', JSON.stringify(updatedRecipes));
    if (activeCookbook === id) setActiveCookbook(null);
  }

  async function moveRecipeToCookbook(recipeId, cookbookId) {
    const updated = saved.map(r => r.id === recipeId ? { ...r, cookbookId } : r);
    setSaved(updated);
    await AsyncStorage.setItem('saved_recipes', JSON.stringify(updated));
  }

  async function generateFromIdea() {
    if (!scratchIdea.trim()) return;
    setGeneratingRecipe(true);
    setShowWriteFromScratch(false);
    setLoading(true);
    setRecipe(null);
    try {
      const res = await fetch('https://web-production-70819.up.railway.app/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: scratchIdea }),
      });
      const data = await res.json();
      const raw = data.text;
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      const generatedRecipe = JSON.parse(raw.slice(start, end));
      setRecipe({ ...generatedRecipe, sourceUrl: null });
      setScratchIdea('');
    } catch (e) {
      Alert.alert('Error', 'Could not generate recipe. Try again.');
    } finally {
      setLoading(false);
      setGeneratingRecipe(false);
    }
  }

  async function extractFromUrl() {
    if (!url.trim()) return;
    setLoading(true);
    setRecipe(null);
    closeSheet();
    try {
      const res = await fetch('https://web-production-70819.up.railway.app/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipe({ ...data.recipe, sourceUrl: url, thumbnail: data.thumbnail });
      setUrl('');
    } catch (e) {
      Alert.alert(
        'Extraction Failed',
        'Could not extract the recipe. Try again or try a different video.',
        [
          { text: 'Try Again', onPress: () => extractFromUrl() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  async function extractFromPhoto() {
    closeSheet();
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please go to Settings and allow photo library access.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;
      setLoading(true);
      setRecipe(null);
      const images = result.assets.map(asset => ({
        data: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
      }));
      const res = await fetch('https://web-production-70819.up.railway.app/api/extract-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipe({ ...data.recipe, sourceUrl: null, thumbnail: result.assets[0].base64 });
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function extractFromCamera() {
    closeSheet();
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }

      let capturedImages = [];

      const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
        if (result.canceled) return false;
        capturedImages.push({
          data: result.assets[0].base64,
          mimeType: result.assets[0].mimeType || 'image/jpeg',
        });
        return true;
      };

      const taken = await takePhoto();
      if (!taken) return;

      Alert.alert(
        'Add another page?',
        'Do you want to photograph another page of this recipe?',
        [
          {
            text: 'Yes, add page',
            onPress: async () => {
              const taken2 = await takePhoto();
              if (taken2) {
                Alert.alert(
                  'Add another page?',
                  'Add one more page?',
                  [
                    { text: 'Yes, add page', onPress: async () => { await takePhoto(); processPhotos(capturedImages); } },
                    { text: 'No, extract now', onPress: () => processPhotos(capturedImages) },
                  ]
                );
              } else {
                processPhotos(capturedImages);
              }
            },
          },
          { text: 'No, extract now', onPress: () => processPhotos(capturedImages) },
        ]
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    }
  }

  async function processPhotos(images) {
    try {
      setLoading(true);
      setRecipe(null);
      const res = await fetch('https://web-production-70819.up.railway.app/api/extract-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipe({ ...data.recipe, sourceUrl: null, thumbnail: images[0].data });
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (onboarded === null) return <View style={styles.wrapper} />;

  if (!onboarded) {
    if (obStep === 0) return <GoalsScreen onNext={goals => { setObGoals(goals); setObStep(1); }} onBack={() => {}} />;
    if (obStep === 1) return <AffirmationScreen goals={obGoals} onNext={() => setObStep(2)} onBack={() => setObStep(0)} />;
    if (obStep === 2) return <SourcesScreen onNext={() => setObStep(3)} onBack={() => setObStep(1)} />;
    if (obStep === 3) return <AgeScreen onNext={() => setObStep(4)} onBack={() => setObStep(2)} />;
    if (obStep === 4) return <HeardScreen onNext={() => setObStep(5)} onBack={() => setObStep(3)} />;
    if (obStep === 5) return <ReadyScreen onDone={finishOnboarding} onBack={() => setObStep(4)} />;
  }

  function RecipeDetail({ r, onBack }) {
    const [scale, setScale] = useState(1);
    const [cooked, setCooked] = useState(false);
    const [rating, setRating] = useState(0);
    const [note, setNote] = useState('');
    const [showStepByStep, setShowStepByStep] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const baseServings = parseInt(r.servings) || 1;

    function scaleAmount(amount) {
      const num = parseFloat(amount);
      if (isNaN(num)) return amount;
      const scaled = num * scale;
      return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
    }

    async function addToGroceries() {
      try {
        const json = await AsyncStorage.getItem('grocery_list');
        const existing = json ? JSON.parse(json) : [];
        const newItems = r.ingredients.map(ing => ({
          id: Date.now() + Math.random(),
          name: ing.item,
          amount: scaleAmount(ing.amount),
          unit: ing.unit,
          checked: false,
          recipe: r.dish,
        }));
        const updated = [...existing, ...newItems];
        await AsyncStorage.setItem('grocery_list', JSON.stringify(updated));
        Alert.alert('Added!', `${newItems.length} ingredients added to your grocery list.`);
      } catch (e) {
        Alert.alert('Error', 'Could not add to groceries');
      }
    }

    if (showStepByStep) {
      const steps = r.steps || [];
      const step = steps[currentStep];
      return (
        <View style={styles.wrapper}>
          <StatusBar style="dark" />
          <View style={rd.stepHeader}>
            <TouchableOpacity onPress={() => setShowStepByStep(false)}>
              <Text style={rd.stepClose}>✕</Text>
            </TouchableOpacity>
            <Text style={rd.stepCount}>Step {currentStep + 1} of {steps.length}</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={rd.stepProgress}>
            <View style={[rd.stepProgressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
          </View>
          <ScrollView contentContainerStyle={rd.stepContent}>
            <Text style={rd.stepNumber}>{currentStep + 1}</Text>
            <Text style={rd.stepText}>{step}</Text>
          </ScrollView>
          <View style={rd.stepFooter}>
            {currentStep > 0 && (
              <TouchableOpacity style={rd.stepBackBtn} onPress={() => setCurrentStep(s => s - 1)}>
                <Text style={rd.stepBackBtnText}>← Previous</Text>
              </TouchableOpacity>
            )}
            {currentStep < steps.length - 1 ? (
              <TouchableOpacity style={rd.stepNextBtn} onPress={() => setCurrentStep(s => s + 1)}>
                <Text style={rd.stepNextBtnText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={rd.stepNextBtn} onPress={() => { setShowStepByStep(false); setCooked(true); }}>
                <Text style={rd.stepNextBtnText}>Done! 🎉</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.wrapper}>
        <StatusBar style="dark" />
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
          {r.thumbnail ? (
            <View style={rd.hero}>
              <Image source={{ uri: `data:image/jpeg;base64,${r.thumbnail}` }} style={rd.heroImage} />
              <TouchableOpacity style={rd.heroBack} onPress={onBack}>
                <Text style={rd.heroBackText}>‹</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={rd.heroPlaceholder}>
              <TouchableOpacity style={rd.heroBack} onPress={onBack}>
                <Text style={rd.heroBackText}>‹</Text>
              </TouchableOpacity>
              <Text style={rd.heroPlaceholderEmoji}>🍳</Text>
            </View>
          )}

          <View style={rd.body}>
            <Text style={rd.title}>{r.dish}</Text>

            <View style={rd.actionRow}>
              <TouchableOpacity style={rd.actionBtn} onPress={() => { saveRecipe(r); onBack(); }}>
                <Text style={rd.actionIcon}>🔖</Text>
                <Text style={rd.actionLabel}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={rd.actionBtn} onPress={addToGroceries}>
                <Text style={rd.actionIcon}>🛒</Text>
                <Text style={rd.actionLabel}>Groceries</Text>
              </TouchableOpacity>
              {r.sourceUrl && (
                <TouchableOpacity style={rd.actionBtn} onPress={() => Linking.openURL(r.sourceUrl)}>
                  <Text style={rd.actionIcon}>▶️</Text>
                  <Text style={rd.actionLabel}>Watch</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={rd.actionBtn} onPress={() => Alert.alert('Share', 'Sharing coming soon!')}>
                <Text style={rd.actionIcon}>↑</Text>
                <Text style={rd.actionLabel}>Share</Text>
              </TouchableOpacity>
            </View>

            <View style={rd.metaRow}>
              <View style={rd.metaItem}>
                <Text style={rd.metaLabel}>PREP</Text>
                <Text style={rd.metaValue}>{r.prep_time || '—'}</Text>
              </View>
              <View style={rd.metaDivider} />
              <View style={rd.metaItem}>
                <Text style={rd.metaLabel}>COOK</Text>
                <Text style={rd.metaValue}>{r.cook_time || '—'}</Text>
              </View>
              <View style={rd.metaDivider} />
              <View style={rd.metaItem}>
                <Text style={rd.metaLabel}>SERVES</Text>
                <Text style={rd.metaValue}>{Math.round(baseServings * scale)}</Text>
              </View>
            </View>

            <View style={rd.cookedRow}>
              <TouchableOpacity style={rd.cookedBtn} onPress={() => setCooked(!cooked)}>
                <Text style={rd.cookedIcon}>{cooked ? '✅' : '⬜'}</Text>
                <Text style={rd.cookedLabel}>Mark as Cooked</Text>
              </TouchableOpacity>
              <View style={rd.stars}>
                {[1,2,3,4,5].map(s => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Text style={[rd.star, s <= rating && rd.starFilled]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={rd.noteInput}
              placeholder="Add a note..."
              placeholderTextColor="#bbb"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <Text style={rd.sectionTitle}>INGREDIENTS</Text>
            <View style={rd.servingsRow}>
              <TouchableOpacity style={rd.servingsBtn} onPress={() => setScale(s => Math.max(0.5, s - 0.5))}>
                <Text style={rd.servingsBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={rd.servingsCount}>{Math.round(baseServings * scale)}</Text>
              <TouchableOpacity style={rd.servingsBtn} onPress={() => setScale(s => s + 0.5)}>
                <Text style={rd.servingsBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={rd.servingsLabel}>servings</Text>
            </View>

            {r.ingredients?.map((ing, i) => (
              <View key={i} style={rd.ingredientRow}>
                <Text style={rd.ingredientEmoji}>{getIngredientEmoji(ing.item)}</Text>
                <Text style={rd.ingredientText}>
                  <Text style={rd.ingredientAmount}>{scaleAmount(ing.amount)} {ing.unit} </Text>
                  {ing.item}
                </Text>
              </View>
            ))}

            <TouchableOpacity style={rd.addGroceriesBtn} onPress={addToGroceries}>
              <Text style={rd.addGroceriesIcon}>🛒</Text>
              <Text style={rd.addGroceriesBtnText}>Add to groceries</Text>
            </TouchableOpacity>

            {r.nutrition && (
              <>
                <Text style={rd.sectionTitle}>NUTRITION PER SERVING</Text>
                <View style={rd.nutritionRow}>
                  <View style={rd.nutritionItem}>
                    <Text style={rd.nutritionValue}>{Math.round((r.nutrition.calories || 0) * scale)}</Text>
                    <Text style={rd.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={rd.nutritionItem}>
                    <Text style={rd.nutritionValue}>{Math.round((r.nutrition.protein || 0) * scale)}g</Text>
                    <Text style={rd.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={rd.nutritionItem}>
                    <Text style={rd.nutritionValue}>{Math.round((r.nutrition.carbs || 0) * scale)}g</Text>
                    <Text style={rd.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={rd.nutritionItem}>
                    <Text style={rd.nutritionValue}>{Math.round((r.nutrition.fat || 0) * scale)}g</Text>
                    <Text style={rd.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </>
            )}

            <Text style={rd.sectionTitle}>INSTRUCTIONS</Text>
            <TouchableOpacity style={rd.stepByStepBtn} onPress={() => { setCurrentStep(0); setShowStepByStep(true); }}>
              <Text style={rd.stepByStepIcon}>▶</Text>
              <Text style={rd.stepByStepBtnText}>Cook step-by-step</Text>
            </TouchableOpacity>

            {r.steps?.map((step, i) => (
              <View key={i} style={rd.stepRow}>
                <Text style={rd.stepNum}>{i + 1}</Text>
                <Text style={rd.stepDesc}>{step}</Text>
              </View>
            ))}

            {r.tips?.length > 0 && (
              <>
                <Text style={rd.sectionTitle}>TIPS</Text>
                {r.tips.map((tip, i) => (
                  <Text key={i} style={styles.tip}>• {tip}</Text>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (recipe) {
    return <RecipeDetail r={recipe} onBack={() => setRecipe(null)} />;
  }

  if (viewing) {
    return <RecipeDetail r={viewing} onBack={() => setViewing(null)} />;
  }

  const filteredRecipes = activeCookbook === null
    ? saved
    : saved.filter(r => r.cookbookId === activeCookbook);

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 Reel Meals</Text>
      </View>

      {activeTab === 'recipes' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.loadingText}>Extracting recipe...</Text>
            </View>
          )}

          <Text style={cbk.sectionLabel}>Cookbooks</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cbk.row} contentContainerStyle={{ paddingRight: 20 }}>
            <TouchableOpacity
              style={[cbk.folder, activeCookbook === null && cbk.folderActive]}
              onPress={() => setActiveCookbook(null)}
            >
              <Text style={cbk.folderEmoji}>📚</Text>
              <Text style={cbk.folderName}>All Recipes</Text>
              <Text style={cbk.folderCount}>{saved.length}</Text>
            </TouchableOpacity>

            {cookbooks.map(book => (
              <TouchableOpacity
                key={book.id}
                style={[cbk.folder, activeCookbook === book.id && cbk.folderActive]}
                onPress={() => setActiveCookbook(book.id)}
                onLongPress={() => Alert.alert(book.name, 'Delete this cookbook?', [
                  { text: 'Delete', style: 'destructive', onPress: () => deleteCookbook(book.id) },
                  { text: 'Cancel', style: 'cancel' },
                ])}
              >
                <Text style={cbk.folderEmoji}>📖</Text>
                <Text style={cbk.folderName} numberOfLines={1}>{book.name}</Text>
                <Text style={cbk.folderCount}>{saved.filter(r => r.cookbookId === book.id).length}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={cbk.newFolder} onPress={() => setShowNewCookbook(true)}>
              <Text style={cbk.newFolderIcon}>+</Text>
              <Text style={cbk.newFolderLabel}>New</Text>
            </TouchableOpacity>
          </ScrollView>

          {filteredRecipes.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👨‍🍳</Text>
              <Text style={styles.emptyTitle}>
                {activeCookbook ? 'No recipes here yet' : "Let's get cooking!"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeCookbook ? 'Long press a recipe to move it here' : 'Tap the + button to add your first recipe'}
              </Text>
            </View>
          ) : (
            <View style={grid.container}>
              {filteredRecipes.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={grid.card}
                  onPress={() => setViewing(r)}
                  onLongPress={() => Alert.alert(
                    r.dish,
                    'What would you like to do?',
                    [
                      {
                        text: 'Move to Cookbook',
                        onPress: () => {
                          if (cookbooks.length === 0) {
                            Alert.alert('No Cookbooks', 'Create a cookbook first by tapping the + New button.');
                            return;
                          }
                          Alert.alert(
                            'Move to Cookbook',
                            'Choose a cookbook',
                            [
                              ...cookbooks.map(book => ({
                                text: book.name,
                                onPress: () => moveRecipeToCookbook(r.id, book.id),
                              })),
                              { text: 'Remove from Cookbook', onPress: () => moveRecipeToCookbook(r.id, null) },
                              { text: 'Cancel', style: 'cancel' },
                            ]
                          );
                        },
                      },
                      { text: 'Delete Recipe', style: 'destructive', onPress: () => deleteRecipe(r.id) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  )}
                >
                  {r.thumbnail ? (
                    <Image source={{ uri: `data:image/jpeg;base64,${r.thumbnail}` }} style={grid.cardImage} />
                  ) : (
                    <View style={grid.cardImagePlaceholder}>
                      <Text style={grid.cardImageEmoji}>🍳</Text>
                    </View>
                  )}
                  <View style={grid.cardBody}>
                    <Text style={grid.cardTitle} numberOfLines={2}>{r.dish}</Text>
                    <Text style={grid.cardMeta}>⏱ {r.prep_time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'mealplan' && <MealPlanScreen saved={saved} />}
      {activeTab === 'groceries' && <MacrosScreen saved={saved} />}
      {activeTab === 'more' && <DiscoverScreen onSaveRecipe={saveRecipe} />}

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('recipes')}>
          <Text style={styles.tabIcon}>📚</Text>
          <Text style={[styles.tabLabel, activeTab === 'recipes' && styles.tabLabelActive]}>Recipes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('mealplan')}>
          <Text style={styles.tabIcon}>📅</Text>
          <Text style={[styles.tabLabel, activeTab === 'mealplan' && styles.tabLabelActive]}>Meal Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={openSheet}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('groceries')}>
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={[styles.tabLabel, activeTab === 'groceries' && styles.tabLabelActive]}>Macros</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('more')}>
          <Text style={styles.tabIcon}>🧭</Text>
          <Text style={[styles.tabLabel, activeTab === 'more' && styles.tabLabelActive]}>Discover</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddSheet} transparent animationType="none" onRequestClose={closeSheet}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a recipe</Text>
            {!showUrlInput ? (
              <>
                <TouchableOpacity style={styles.sheetOptionLarge} onPress={() => setShowUrlInput(true)}>
                  <Text style={styles.sheetOptionIcons}>📸🎵</Text>
                  <View style={styles.sheetOptionText}>
                    <Text style={styles.sheetOptionTitle}>Add from social media</Text>
                    <Text style={styles.sheetOptionSubtitle}>Paste an Instagram or TikTok link</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.sheetGrid}>
                  <TouchableOpacity style={styles.sheetGridItem} onPress={extractFromPhoto}>
                    <Text style={styles.sheetGridIcon}>🖼️</Text>
                    <Text style={styles.sheetGridLabel}>Upload photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetGridItem} onPress={extractFromCamera}>
                    <Text style={styles.sheetGridIcon}>📷</Text>
                    <Text style={styles.sheetGridLabel}>Take photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetGridItem} onPress={() => Alert.alert('Coming soon', 'Paste text coming soon!')}>
                    <Text style={styles.sheetGridIcon}>📝</Text>
                    <Text style={styles.sheetGridLabel}>Paste text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetGridItem} onPress={() => { closeSheet(); setTimeout(() => setShowWriteFromScratch(true), 400); }}>
                    <Text style={styles.sheetGridIcon}>✏️</Text>
                    <Text style={styles.sheetGridLabel}>Write from scratch</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.urlInputArea}>
                <Text style={styles.urlInputLabel}>Paste your Instagram or TikTok link</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://www.instagram.com/reel/..."
                  placeholderTextColor="#aaa"
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.urlSubmitBtn, !url.trim() && styles.urlSubmitBtnDisabled]}
                  onPress={extractFromUrl}
                  disabled={!url.trim()}
                >
                  <Text style={styles.urlSubmitBtnText}>Extract Recipe</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowUrlInput(false)} style={styles.urlBackBtn}>
                  <Text style={styles.urlBackBtnText}>← Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showWriteFromScratch} transparent animationType="fade" onRequestClose={() => setShowWriteFromScratch(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={cbk.modalOverlay}>
            <View style={cbk.modalBox}>
              <Text style={cbk.modalTitle}>✏️ Write from Scratch</Text>
              <Text style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>Describe what you want to cook</Text>
              <TextInput
                style={cbk.modalInput}
                placeholder="e.g. salmon rice bowl, spicy chicken tacos..."
                placeholderTextColor="#aaa"
                value={scratchIdea}
                onChangeText={setScratchIdea}
                autoFocus
                multiline
              />
              <View style={cbk.modalButtons}>
                <TouchableOpacity style={cbk.cancelModalBtn} onPress={() => { setShowWriteFromScratch(false); setScratchIdea(''); }}>
                  <Text style={cbk.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[cbk.createBtn, !scratchIdea.trim() && cbk.createBtnDisabled]}
                  onPress={generateFromIdea}
                  disabled={!scratchIdea.trim()}
                >
                  <Text style={cbk.createBtnText}>Generate ✨</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showNewCookbook} transparent animationType="fade" onRequestClose={() => setShowNewCookbook(false)}>
        <View style={cbk.modalOverlay}>
          <View style={cbk.modalBox}>
            <Text style={cbk.modalTitle}>New Cookbook</Text>
            <TextInput
              style={cbk.modalInput}
              placeholder="e.g. Weeknight Dinners"
              placeholderTextColor="#aaa"
              value={newCookbookName}
              onChangeText={setNewCookbookName}
              autoFocus
            />
            <View style={cbk.modalButtons}>
              <TouchableOpacity style={cbk.cancelModalBtn} onPress={() => { setShowNewCookbook(false); setNewCookbookName(''); }}>
                <Text style={cbk.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[cbk.createBtn, !newCookbookName.trim() && cbk.createBtnDisabled]} onPress={createCookbook} disabled={!newCookbookName.trim()}>
                <Text style={cbk.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ob = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff', paddingTop: 56 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, gap: 12 },
  backBtn: { width: 32 },
  backText: { fontSize: 28, color: '#333', lineHeight: 32 },
  skipText: { fontSize: 15, color: '#999', width: 40, textAlign: 'right' },
  progressBg: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#7c3aed', borderRadius: 3 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 24 },
  affirmBody: { fontSize: 17, color: '#444', lineHeight: 26, marginBottom: 20 },
  affirmNote: { fontSize: 15, color: '#666', lineHeight: 24 },
  option: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionSelected: { borderColor: '#7c3aed', backgroundColor: '#faf7ff' },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontSize: 16, color: '#1a1a1a', fontWeight: '500' },
  featureList: { marginTop: 24, gap: 16 },
  featureItem: { fontSize: 16, color: '#333', lineHeight: 24 },
  footer: { padding: 20, paddingBottom: 36 },
  continueBtn: { backgroundColor: '#7c3aed', borderRadius: 14, padding: 18, alignItems: 'center' },
  continueBtnDisabled: { backgroundColor: '#c4b5fd' },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
});

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f0' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 15, color: '#666' },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  tip: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 6 },
  comingSoon: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  comingSoonEmoji: { fontSize: 48 },
  comingSoonTitle: { fontSize: 22, fontWeight: '700' },
  comingSoonText: { fontSize: 15, color: '#999' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 28, paddingTop: 8, alignItems: 'center' },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 11, color: '#999' },
  tabLabelActive: { color: '#7c3aed', fontWeight: '600' },
  addBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  addBtnText: { color: '#fff', fontSize: 32, lineHeight: 36, fontWeight: '300' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  sheetOptionLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 16, padding: 16, marginBottom: 16, gap: 14, borderWidth: 1, borderColor: '#eee' },
  sheetOptionIcons: { fontSize: 28 },
  sheetOptionText: { flex: 1 },
  sheetOptionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  sheetOptionSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sheetGridItem: { width: '47%', backgroundColor: '#f9f9f9', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#eee' },
  sheetGridIcon: { fontSize: 32 },
  sheetGridLabel: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  urlInputArea: { gap: 12 },
  urlInputLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  urlInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1.5, borderColor: '#e0e0e0' },
  urlSubmitBtn: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center' },
  urlSubmitBtnDisabled: { backgroundColor: '#c4b5fd' },
  urlSubmitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  urlBackBtn: { alignItems: 'center', padding: 8 },
  urlBackBtnText: { color: '#7c3aed', fontSize: 14 },
});

const mp = StyleSheet.create({
  dayBlock: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  dayLabel: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#1a1a1a' },
  slot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  slotFilled: { backgroundColor: '#faf7ff', borderColor: '#7c3aed' },
  mealLabel: { fontSize: 13, color: '#888', fontWeight: '500', width: 70 },
  assignedRecipe: { flex: 1, fontSize: 13, fontWeight: '600', color: '#7c3aed', textAlign: 'right' },
  addLabel: { fontSize: 13, color: '#ccc' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  recipeOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  recipeOptionName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  recipeOptionMeta: { fontSize: 12, color: '#888' },
  cancelBtn: { marginTop: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#666' },
});

const rd = StyleSheet.create({
  hero: { width: '100%', height: 280, position: 'relative' },
  heroImage: { width: '100%', height: 280 },
  heroPlaceholder: { width: '100%', height: 200, backgroundColor: '#f0ebff', alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderEmoji: { fontSize: 64 },
  heroBack: { position: 'absolute', top: 56, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  heroBackText: { fontSize: 22, color: '#333', lineHeight: 26 },
  body: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
  metaRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 14, padding: 16, marginBottom: 20 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, backgroundColor: '#eee' },
  metaLabel: { fontSize: 10, color: '#999', letterSpacing: 1, marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cookedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cookedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cookedIcon: { fontSize: 20 },
  cookedLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  stars: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 22, color: '#ddd' },
  starFilled: { color: '#f4c262' },
  noteInput: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', marginBottom: 24, minHeight: 60, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 12, color: '#7c3aed', letterSpacing: 1.5, fontWeight: '700', marginBottom: 14, marginTop: 8 },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  servingsBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  servingsBtnText: { fontSize: 18, color: '#333', lineHeight: 20 },
  servingsCount: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  servingsLabel: { fontSize: 14, color: '#888' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  ingredientEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  ingredientText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  ingredientAmount: { fontWeight: '700', color: '#1a1a1a' },
  addGroceriesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 24 },
  addGroceriesIcon: { fontSize: 18 },
  addGroceriesBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  stepByStepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, marginBottom: 20 },
  stepByStepIcon: { fontSize: 16, color: '#333' },
  stepByStepBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  stepNum: { fontSize: 16, fontWeight: '700', color: '#ccc', width: 20 },
  stepDesc: { flex: 1, fontSize: 14, lineHeight: 22, color: '#333' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  stepClose: { fontSize: 20, color: '#333' },
  stepCount: { fontSize: 14, fontWeight: '600', color: '#666' },
  stepProgress: { height: 4, backgroundColor: '#eee', marginHorizontal: 20, borderRadius: 2, marginBottom: 24 },
  stepProgressFill: { height: 4, backgroundColor: '#7c3aed', borderRadius: 2 },
  stepContent: { padding: 24, paddingTop: 0, flex: 1 },
  stepNumber: { fontSize: 64, fontWeight: '700', color: '#f0ebff', marginBottom: 16 },
  stepText: { fontSize: 20, lineHeight: 32, color: '#1a1a1a', fontWeight: '500' },
  stepFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 48, gap: 12 },
  stepBackBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  stepBackBtnText: { fontSize: 15, fontWeight: '600', color: '#333' },
  stepNextBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  stepNextBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  nutritionRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 14, padding: 16, marginBottom: 20 },
  nutritionItem: { flex: 1, alignItems: 'center' },
  nutritionValue: { fontSize: 18, fontWeight: '700', color: '#7c3aed', marginBottom: 4 },
  nutritionLabel: { fontSize: 10, color: '#999', letterSpacing: 1 },
});

const grid = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: { width: '100%', height: 120, backgroundColor: '#f0ebff', alignItems: 'center', justifyContent: 'center' },
  cardImageEmoji: { fontSize: 40 },
  cardBody: { padding: 10, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', lineHeight: 18 },
  cardMeta: { fontSize: 11, color: '#999' },
});

const cbk = StyleSheet.create({
  sectionLabel: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { marginBottom: 20, marginLeft: -20 },
  folder: { width: 100, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginLeft: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#eee' },
  folderActive: { borderColor: '#7c3aed', backgroundColor: '#faf7ff' },
  folderEmoji: { fontSize: 28 },
  folderName: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
  folderCount: { fontSize: 11, color: '#999' },
  newFolder: { width: 80, backgroundColor: '#f9f9f9', borderRadius: 16, padding: 12, marginLeft: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#eee', justifyContent: 'center' },
  newFolderIcon: { fontSize: 28, color: '#7c3aed', fontWeight: '300' },
  newFolderLabel: { fontSize: 12, fontWeight: '600', color: '#7c3aed' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '80%', gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#e0e0e0' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelModalBtnText: { fontSize: 15, fontWeight: '600', color: '#666' },
  createBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center' },
  createBtnDisabled: { backgroundColor: '#c4b5fd' },
  createBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

const mac = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  settingsBtn: { fontSize: 14, color: '#7c3aed', fontWeight: '600' },
  calorieCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 },
  calorieMain: { alignItems: 'center' },
  calorieNumber: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  calorieLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  calorieDivider: { width: 1, height: 40, backgroundColor: '#eee' },
  barsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, gap: 16 },
  barRow: { gap: 6 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  barValues: { fontSize: 12, color: '#999' },
  barBg: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  addMealBtn: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  addMealBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  scanBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#7c3aed' },
  scanBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 16 },
  suggestBtn: { backgroundColor: '#f0ebff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#7c3aed' },
  suggestBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  logEntry: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  logName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  logMacros: { fontSize: 12, color: '#888' },
  logDelete: { fontSize: 16, color: '#ccc', paddingLeft: 12 },
  logAddBtn: { fontSize: 13, fontWeight: '600', color: '#7c3aed' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  recipeOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  recipeOptionName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  recipeOptionMacros: { fontSize: 12, color: '#888' },
  cancelBtn: { marginTop: 12, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#666' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  goalLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  goalInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, width: 100, fontSize: 15, textAlign: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  saveGoalsBtn: { backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  saveGoalsBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  scannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scannerBox: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 16, marginBottom: 24 },
  scannerHint: { color: '#fff', fontSize: 14, marginBottom: 24 },
  scannerCancel: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  scannerCancelText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  selectedRecipeName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  servingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 8 },
  servingBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  servingBtnText: { fontSize: 20, color: '#7c3aed', fontWeight: '600' },
  servingInput: { width: 80, textAlign: 'center', fontSize: 20, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: '#7c3aed', paddingBottom: 4 },
  nutritionPreview: { backgroundColor: '#f0ebff', borderRadius: 12, padding: 12, marginBottom: 16 },
  nutritionPreviewText: { fontSize: 13, color: '#7c3aed', fontWeight: '600', textAlign: 'center' },
  pctBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  pctBtnText: { fontSize: 16, color: '#333', fontWeight: '600' },
  pctValue: { fontSize: 16, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  gramsValue: { fontSize: 13, color: '#999', minWidth: 40 },
  totalPct: { borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center' },
  totalPctText: { fontSize: 13, fontWeight: '600' },
  groceryBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#f59e0b' },
  groceryBtnText: { color: '#f59e0b', fontWeight: '600', fontSize: 16 },
  searchBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#22c55e' },
  searchBtnText: { color: '#22c55e', fontWeight: '600', fontSize: 16 },
});

const disc = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#eee' },
  filterChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#fff' },
  refreshBtn: { backgroundColor: '#f0ebff', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: '#7c3aed' },
  refreshBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  cardImage: { height: 120, backgroundColor: '#f0ebff', alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 48 },
  cardTagRow: { position: 'absolute', top: 8, right: 8 },
  cardTag: { backgroundColor: 'rgba(124,58,237,0.15)', color: '#7c3aed', fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', lineHeight: 18, marginBottom: 4 },
  cardMeta: { fontSize: 11, color: '#999', marginBottom: 2 },
  cardCals: { fontSize: 11, color: '#7c3aed', fontWeight: '600' },
  heroPlaceholder: { height: 240, backgroundColor: '#f0ebff', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 80 },
  backBtn: { position: 'absolute', top: 56, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: '#333', lineHeight: 26 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: '#f0ebff', color: '#7c3aed', fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  detailDesc: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  metaRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 14, padding: 16, marginBottom: 20 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaDivider: { width: 1, backgroundColor: '#eee' },
  metaValue: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  metaLabel: { fontSize: 10, color: '#999', letterSpacing: 1 },
  nutritionRow: { flexDirection: 'row', backgroundColor: '#faf7ff', borderRadius: 14, padding: 16, marginBottom: 20 },
  nutritionItem: { flex: 1, alignItems: 'center' },
  nutritionValue: { fontSize: 16, fontWeight: '700', color: '#7c3aed', marginBottom: 2 },
  nutritionLabel: { fontSize: 10, color: '#999' },
  sectionTitle: { fontSize: 12, color: '#7c3aed', letterSpacing: 1.5, fontWeight: '700', marginBottom: 14, marginTop: 8 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  ingredientEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  ingredientText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  ingredientAmount: { fontWeight: '700', color: '#1a1a1a' },
  stepRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  stepNum: { fontSize: 16, fontWeight: '700', color: '#ccc', width: 20 },
  stepDesc: { flex: 1, fontSize: 14, lineHeight: 22, color: '#333' },
  saveBtn: { backgroundColor: '#7c3aed', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const gr = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  itemChecked: { opacity: 0.6 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#999' },
  itemRecipe: { fontSize: 12, color: '#999', marginTop: 2 },
  mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  mealMeta: { fontSize: 12, color: '#999' },
  mealProgress: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#f0f0f0', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  mealProgressFill: { height: 3, backgroundColor: '#7c3aed', borderBottomLeftRadius: 16 },
});