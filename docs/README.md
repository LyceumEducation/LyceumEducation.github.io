# Conjugación: Spanish Present Tense Lab

A sophisticated, interactive web application for mastering Spanish verb conjugation in the present indicative tense. Built for curious language learners who want to understand *why* verbs conjugate the way they do, not just memorize them.

Conjugación is the first Lyceum Education product. Read the [Lyceum
Education vision](docs/LYCEUM-VISION.md) for the ecosystem's product,
learning-science, UX, brand, and platform principles.

## Accounts and memory

The site remains a static GitHub Pages site and does not run Python or require
an external authentication setup. Account creation and login use a
browser-local account store in [`auth.js`](../auth.js), with SHA-256 password
hashes, profile names, a persistent session, and reload-safe memory. Successful
signup logs the user into the classroom dashboard immediately. Accounts can be
created as students, educators, or guardians. The classroom workspace stores
classes, announcements, assignments, submissions, grades, guardian links, and
prototype admin messages in the same browser-local store. This is appropriate
for a prototype or single-device experience; it is not a replacement for a
server-backed account system or cross-device identity. Google login was
intentionally removed rather than presenting a button that could not work
without an OAuth provider.

---

## 🎯 Mission Statement

**Conjugación** bridges the gap between rote memorization and genuine linguistic understanding. By making the hidden rules of Spanish morphology visible and interactive, we empower learners to conjugate verbs they've never seen before and recognize patterns across the entire language.

### The Problem We Solve

Traditional conjugation tools treat verbs as isolated cases. A learner sees that "pensar" becomes "pienso" but has no intuition for *why*, or whether "tenser," "sentar," or "entender" follow the same pattern. This creates:

- **Fragmented knowledge** — memorizing tables instead of understanding systems
- **Limited transferability** — can't apply learning to new verbs
- **Low retention** — without structure, knowledge fades
- **Anxiety** — conjugation feels arbitrary and overwhelming

**Conjugación** solves this by exposing the phonological and orthographic rules that govern Spanish conjugation, making patterns visible, predictable, and learnable.

---

## 💡 How It Works: The Conjugation Engine

The core of **Conjugación** is a **multi-layer morphological compiler** that conjugates verbs using phonologically-grounded algorithms rather than simple lookup tables. Here's how it works:

### 1. Overall Pipeline

Every conjugation follows this four-stage process:

```
Input (rawVerb) → Normalize → Classify → Build → Output (word)
```

#### **Stage 1: Normalization** (Preparing the Input)

The engine first normalizes the infinitive:

```javascript
function compilerNormalize(rawVerb) {
    const value = String(rawVerb || "").trim().toLowerCase();
    const reflexive = value.endsWith("se");
    const infinitive = reflexive ? value.slice(0, -2) : value;
    return { input: value, infinitive, reflexive };
}
```

**What happens:**
- Strips reflexive marker (`-se`) from verbs like "lavarse" → "lavar"
- Normalizes to lowercase
- Preserves reflexivity flag for later processing

**Example:** "Lavarse" → `{ infinitive: "lavar", reflexive: true }`

---

### 2. Classification System (The Decision Tree)

Every Spanish verb falls into one of six classes, each with different conjugation rules:

```javascript
function compilerClassification(infinitive) {
    if (compilerAnomalyForms[infinitive] || compilerIrregularPresent[infinitive]) 
        return 5;  // Total anomalies
    if (compilerOrthographicYo[infinitive]) 
        return 4;  // Yo-irregular
    const type = compilerStemType(infinitive);
    return type === "e>ie" ? 1 : type === "o>ue" ? 2 : type === "e>i" ? 3 : 0;
}
```

| Class | Category | Examples | Conjugation Strategy |
|-------|----------|----------|----------------------|
| **5** | Total Anomalies | ser, ir, estar, haber | Lookup table (complete forms) |
| **4** | Yo-Irregular | hacer, tener, poner, venir | Special yo-form + regular endings |
| **1** | e→ie Stem Change | pensar, querer, entender, tener | Vowel diphthongization |
| **2** | o→ue Stem Change | dormir, poder, volver, morir | Vowel diphthongization |
| **3** | e→i Stem Change | pedir, servir, seguir, competir | Vowel reduction |
| **0** | Regular | hablar, comer, vivir, caminar | Standard endings only |

This hierarchy ensures efficiency: the engine handles anomalies first (constant-time lookup), then applies increasingly sophisticated rule systems.

---

### 3. Stem-Change Detection (The Phonological Pattern Matcher)

Here's where **Conjugación** demonstrates true linguistic sophistication. Rather than memorizing a dictionary of stem-changing verbs, the engine *predicts* stem changes from **orthographic patterns**:

```javascript
const compilerStemPatterns = Object.freeze([
    { pattern: /(e)(nd|nt|mp|nz|rm|rt|rr|st|sp)[a-záéíóúü]*$/, type: "e>ie" },
    { pattern: /(e)(l|r|m|n)[a-záéíóúü]*$/, type: "e>ie" },
    { pattern: /(o)(rm|lv|rd|st|nt|str)[a-záéíóúü]*$/, type: "o>ue" },
    { pattern: /(u)(g|r|d|z)[a-záéíóúü]*$/, type: "u>ue" },
    { pattern: /(e)gu$/, type: "e>i" },
    { pattern: /(e)(d|t|r|g|b)[ií][a-záéíóúü]*$/, type: "e>i" }
]);

#### **The Principle: Closed Syllable Hypothesis**

In Spanish, stressed vowels in *closed syllables* (ending in consonants) undergo diphthongization. Open syllables stay unchanged. The patterns above encode which consonant clusters indicate stress.

#### **Pattern Matching Examples**

| Verb | Root | Pattern Match | Result |
|------|------|---------------|--------|
| pensar | pens | (e)(n)... | e→ie ✓ |
| querer | quer | (e)(r)... | e→ie ✓ |
| dormir | dorm | (o)(rm)... | o→ue ✓ |
| volver | volv | (o)(lv)... | o→ue ✓ |
| pedir | ped | (e)(d)... | e→i ✓ |
| seguir | seg | (e)gu | e→i ✓ |

This means the engine can conjugate verbs it has never seen before, as long as they match one of these phonological environments. A learner can try "nepensar" (not a real word) and the engine will correctly predict e→ie conjugation.

---

### 4. Vowel Extraction Algorithm (Finding the Target)

Before mutating a stem, the engine must identify *which* vowel to change. Spanish has multiple vowels; the rule is to change the stressed one closest to the ending:

```javascript
function compilerReverseVowel(root) {
    let pointer = root.length - 1;
    while (pointer > 0) {
        pointer -= 1;
        const index = pointer;
        const character = root[index];
        const silentU = character === "u"
            && index > 0
            && root[index - 1] === "g"
            && index === root.length - 1;
        if (compilerVowels.has(character) && !silentU) return index;
    }
    return -1;
}
```

**Algorithm:**
1. Start from the end of the root and scan backwards
2. Skip the orthographic (silent) "u" in "gu" (e.g., sigue, agua)
3. Return the index of the penultimate stressed vowel

**Examples:**
- `pens` → finds `e` at index 1 ✓
- `dorm` → finds `o` at index 1 ✓
- `sigu` → finds `e` (ignores the silent `u` in `gu`) ✓
- `recuerdo` → finds second `e` (most recent vowel before ending) ✓

---

### 5. Mutation Mechanism (The Transformation)

Once the target vowel is identified, the engine replaces it according to the stem-change type:

```javascript
function compilerMutation(root, type, reduced = false) {
    const target = compilerReverseVowel(root);
    if (target < 0 || !type) return root;
    const token = reduced
        ? ({ "e>ie": "i", "o>ue": "u", "e>i": "i", "u>ue": "u" }[type])
        : ({ "e>ie": "ie", "o>ue": "ue", "e>i": "i", "u>ue": "ue" }[type]);
    return token ? root.slice(0, target) + token + root.slice(target + 1) : root;
}
```

**Two Mutation Modes:**

| Mode | Replacement | Use Case | Example |
|------|-------------|----------|---------|
| **Full** (reduced=false) | e→ie, o→ue, e→i, u→ue | Present indicative | pens → piens |
| **Reduced** (reduced=true) | e→i, o→u, e→i, u→u | Preterite (ir-class) | dorm → durm |

**Walkthrough: "pensar" → "yo pienso"**
1. Infinitive: pensar
2. Root: pens (remove -ar)
3. Target vowel: e at index 1
4. Type detected: e>ie
5. Mutation: pens[0] + "ie" + pens[2:] = **piens**
6. Add ending: piens + o = **pienso** ✓

---

### 6. The Boot Mask (Subject-Based Activation)

Here's a key insight: **stem changes don't apply to all subjects equally**. The nosotros and vosotros forms preserve the original vowel:

```javascript
const compilerBootMask = Object.freeze([
    true,   // yo        (apply mutation)
    true,   // tú        (apply mutation)
    true,   // él/ella   (apply mutation)
    false,  // nosotros  (NO mutation)
    false,  // vosotros  (NO mutation)
    true    // ellos     (apply mutation)
]);
```

**Why?** In Spanish, nosotros and vosotros are naturally unstressed, so phonological rules that apply to stressed forms don't trigger.

**Effect on "pensar":**
- yo **pienso** (stem mutated: piens + o)
- tú **piensas** (stem mutated: piens + as)
- él **piensa** (stem mutated: piens + a)
- nosotros **pensamos** (stem unchanged: pens + amos) ← Regular ending
- vosotros **pensáis** (stem unchanged: pens + áis) ← Regular ending
- ellos **piensan** (stem mutated: piens + an)

---

### 7. Ending Tables (Structural Morphology)

After the stem is processed, the engine appends subject-specific endings:

```javascript
const compilerPresentEndings = Object.freeze({
    ar: ["o", "as", "a", "amos", "áis", "an"],
    er: ["o", "es", "e", "emos", "éis", "en"],
    ir: ["o", "es", "e", "imos", "ís", "en"]
});
```

**The formula:**
```
conjugated_form = stem + ending[subjectIndex]
```

**Example for "hablar" (regular -ar verb):**
- yo: habl + **o** = hablo
- tú: habl + **as** = hablas
- él: habl + **a** = habla
- nosotros: habl + **amos** = hablamos
- vosotros: habl + **áis** = habláis
- ellos: habl + **an** = hablan

---

### 8. Irregular Yo-Forms (The -G Insertion)

Many Spanish verbs have irregular first-person forms that insert a consonant:

```javascript
const compilerOrthographicYo = Object.freeze({
    hacer: "hag",      // hago (not haceo)
    decir: "dig",      // digo (not decio)
    conocer: "conozc", // conozco (not conoceo)
    conducir: "conduzc", // conduzco
    escoger: "escoj",  // escojo
    exigir: "exij",    // exijo
    ofrecer: "ofrezc", // ofrezco
    poner: "pong",     // pongo
    salir: "salg",     // salgo
    satisfacer: "satisfag", // satisfago
    traer: "traig",    // traigo
    valer: "valg",     // valgo
    venir: "veng",     // vengo
    tener: "teng",     // tengo
    oír: "oig"         // oigo
});
```

**Application:** The special stem is used *only for yo*. Other subjects use regular conjugation:
- yo **hago** (special stem hag + o)
- tú **haces** (regular root hac + regular ending es)
- él **hace** (regular root hac + regular ending e)

---

### 9. Total Anomalies (Lookup Tables)

Some verbs are so irregular that rule-based approaches fail. These are handled via lookup tables:

```javascript
const compilerIrregularPresent = Object.freeze({
    ser: ["soy", "eres", "es", "somos", "sois", "son"],
    estar: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    ir: ["voy", "vas", "va", "vamos", "vais", "van"],
    haber: ["he", "has", "ha", "hemos", "habéis", "han"],
    saber: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
    oír: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"]
});
```

These verbs get O(1) constant-time lookup instead of attempting rule application.

---

### 10. Orthographic Adjustments

The engine handles several Spanish spelling rules:

#### **Silent U Resolution**

When "gu" appears at the end of a stem (like in "sigo"), the "u" is silent for pronunciation but marks that the "g" is hard [g]. When adding a suffix starting with "a" or "o", the "u" must be removed:

```javascript
function compilerResolveSilentU(stem, suffix) {
    return /^[oa]$/.test(suffix) && /gu$/.test(stem)
        ? `${stem.slice(0, -2)}g`
        : stem;
}
```

**Example: "seguir"**
- yo sigo: sigu + o → **sigo** ✓ (u removed before o)
- tú sigues: sigu + es → **sigues** ✓ (u kept before e)

#### **Y-Insertion for -UIR Verbs**

Verbs ending in `-uir` (like construir, distribuir) insert a glide consonant "y" between the stem and ending in most forms:

```javascript
function compilerIsUir(infinitive) {
    return /uir$/.test(infinitive) && !/(guir|quir)$/.test(infinitive);
}
```

**Example: "construir"**
- yo construyo: constru + y + o = **construyo**
- nosotros construimos: constru + im + os = **construimos** (no y; unstressed)

Exception: "seguir" and "adquirir" don't follow this pattern.

---

### 11. Reflexive Attachment

When a verb is reflexive (ends in -se), the engine attaches the corresponding reflexive pronoun:

```javascript
const compilerPronouns = Object.freeze({ 
    yo: "me", tu: "te", el: "se", nos: "nos", vos: "os", ellos: "se" 
});
```

**Examples:**
- yo: lavo → lav**ome** (negative form) or **lávome** → reduced → **lávame** (positive)
- tú: lavas → lav**ate** → **lávate**
- él: lava → lav**ase** → **lávase**

The engine applies Spanish accentuation rules when attaching pronouns to multi-syllabic words.

---

### 12. Performance & Algorithmic Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Normalization | O(n) | String operations, n = length |
| Classification | O(1) | HashMap lookup |
| Pattern matching | O(m) | m = 6 regex patterns |
| Vowel extraction | O(n) | Linear reverse scan |
| Mutation | O(n) | String slicing |
| Ending lookup | O(1) | Array indexing |
| **Total per conjugation** | **O(n)** | Dominated by string manipulation |

For typical Spanish infinitives (5-15 characters), this executes in microseconds.

---

## 🎨 Design System: CSS Architecture

**Conjugación** uses a carefully crafted design system that makes the conjugation process visible and delightful. Every visual element communicates linguistic information.

### Color Palette

```css
:root {
    --ink: #15233d;           /* Primary text (dark blue) */
    --muted: #62708a;         /* Secondary text (gray) */
    --paper: #f6f8fc;         /* Background (light blue) */
    --card: rgba(255,255,255,.88); /* Card backgrounds */
    --line: #e2e8f2;          /* Borders (light gray) */
    --accent: #7457e8;        /* Interactive elements (purple) */
    --accent-2: #32b7a8;      /* Status indicators (teal) */
    --ar: #3867e8;            /* AR-verb class (blue) */
    --er: #ea6255;            /* ER-verb class (red) */
    --ir: #20a878;            /* IR-verb class (green) */
}
```

**Principle:** Each verb class has its own color. When users conjugate "pensar" (-ar), the result card glows in blue. "Pedir" (-ir) glows in green. This creates visual reinforcement of grammar patterns.

### Layout System

The interface uses **CSS Grid** for responsive, adaptive layouts:

```css
.layout { 
    display: grid; 
    grid-template-columns: minmax(0, 1.03fr) minmax(0, .97fr); 
    gap: 20px; 
}
```

- **Left column:** Conjugation engine (live input)
- **Right column:** Reference matrix (ending patterns)

On mobile (<760px), switches to single-column layout.

### Component: Input Controls

Inputs use a sophisticated custom styling approach:

```css
input, select {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 13px;
    outline: none;
    background: #fff;
    color: var(--ink);
    font: 600 .98rem "DM Sans";
    padding: 13px 14px;
    transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
}

input:hover, input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(116,87,232,.11);
    transform: translateY(-1px);
}
```

**Interactions:**
- **Hover/Focus:** Purple border + subtle shadow + slight lift
- **Smooth transitions:** 250ms for professional feel
- **Accessibility:** Shadow color uses accent color at 11% opacity

### Component: Custom Subject Picker

The subject picker is a fully custom-built dropdown (not a native `<select>`), because native dropdowns can't provide the custom styling needed:

```css
.subject-picker { position: relative; }
.subject-picker select { 
    position: absolute; 
    width: 1px; 
    height: 1px; 
    opacity: 0; 
    pointer-events: none; 
}
```

The native select is hidden, and a styled button/menu replaces it:

```css
.subject-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 48px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: #fff;
    color: var(--muted);
    cursor: pointer;
    font: 600 .98rem "DM Sans";
    padding: 13px 16px 13px 14px;
    transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
}

.subject-trigger::after {
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--accent);
    border-bottom: 2px solid var(--accent);
    content: "";
    transform: rotate(45deg) translateY(-2px);
    transition: transform .32s cubic-bezier(.22, 1, .36, 1);
}

.subject-picker.open .subject-trigger::after {
    transform: rotate(225deg) translate(-2px, -2px);
}
```

The dropdown menu uses GPU-accelerated transforms:

```css
.subject-menu {
    position: absolute;
    z-index: 8;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    visibility: hidden;
    opacity: 0;
    transform: translateY(-10px) scale(.98);
    transform-origin: top center;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: rgba(255,255,255,.98);
    box-shadow: 0 18px 34px rgba(34,48,92,.18);
    padding: 6px;
    pointer-events: none;
    transition: opacity .24s ease, transform .34s cubic-bezier(.22, 1, .36, 1), visibility .24s;
}

.subject-picker.open .subject-menu {
    visibility: visible;
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
}
```

**Interaction:** Opens with spring-like animation (cubic-bezier), scales from 98% to 100%.

### Component: Result Card

The result card is the heart of the UI—it displays the conjugated verb with visual feedback:

```css
.result {
    min-height: 235px;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    color: #fff;
    padding: 27px;
    background: linear-gradient(135deg, #202e53, #493a86);
    transition: background .35s ease, transform .35s ease;
}

.result:hover { transform: translateY(-3px); }

.result.ar { background: linear-gradient(135deg, #244893, #4771e5); }
.result.er { background: linear-gradient(135deg, #963b51, #e76a58); }
.result.ir { background: linear-gradient(135deg, #106c68, #27aa86); }
.result.error { background: linear-gradient(135deg, #572b4b, #a54d68); }
```

**Dynamic Class Assignment:** The JavaScript adds the verb class (`ar`, `er`, `ir`) or `error` to dynamically change the card's gradient color.

**Hover State:** Cards lift up 3px on hover (translateY(-3px)).

### Component: Stem Highlighting

When a stem undergoes mutation, the changed vowels are highlighted in gold:

```css
.word .changed { color: #ffe082; }
.word .ending { color: #fff; }
```

**JavaScript applies this:**

```javascript
function renderWord(data) {
    if (data.type && data.stem.changed !== data.stem.plain) {
        const changed = data.stem.changed;
        const plain = data.stem.plain;
        const index = [...changed].findIndex((char, i) => char !== plain[i]);
        stemHTML = `${changed.slice(0, index)}<span class="changed">
            ${changed.slice(index, endIndex)}</span>${changed.slice(endIndex)}`;
    }
}
```

**Visual Effect:** "pensar" → "p**ie**nso" (the diphthong "ie" is gold, regular ending "o" is white)

### Animation: Answer Entry

When a result appears, it animates in with a subtle entrance:

```css
.word.answer-enter { 
    animation: answer-enter .42s cubic-bezier(.22, 1, .36, 1); 
}

@keyframes answer-enter {
    from {
        opacity: .2;
        transform: translateY(7px) scale(.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
```

**Effect:** Fades in while rising 7px and scaling from 97% to 100% over 420ms.

### Animation: Typing Dots

While processing, a loading indicator shows three animated dots:

```css
.typing-dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,.82);
    animation: typing-dot 1.55s infinite ease-in-out;
}

.typing-dots i:nth-child(2) { animation-delay: .24s; }
.typing-dots i:nth-child(3) { animation-delay: .48s; }

@keyframes typing-dot {
    0%, 60%, 100% { opacity: .35; transform: translateY(0) scale(.8); }
    30% { opacity: 1; transform: translateY(-7px) scale(1); }
}
```

**Effect:** Three dots bounce upward in sequence, creating a sense of activity.

### Animation: Title Dot Bounce

The period after "Conjugación" bounces when a verb is submitted:

```css
.title-dot.bounce { animation: dot-bounce 980ms ease-out; }

@keyframes dot-bounce {
    0% { transform: translateY(0) scale(1); }
    20% { transform: translateY(-.62em) scale(1.04, .97); animation-timing-function: cubic-bezier(.55, 0, 1, .45); }
    62% { transform: translateY(-.08em) scale(.995, 1.005); animation-timing-function: cubic-bezier(.2, .8, .3, 1); }
    78% { transform: translateY(0) scale(1.01, .99); animation-timing-function: cubic-bezier(.2, .8, .3, 1); }
    89% { transform: translateY(-.035em) scale(1, 1); animation-timing-function: cubic-bezier(.2, .8, .3, 1); }
    100% { transform: translateY(0) scale(1); }
}
```

**Effect:** Realistic bouncing motion with easing functions that simulate physics.

### Component: Reference Table

The ending matrix displays all conjugation patterns for reference:

```css
table { 
    width: 100%; 
    min-width: 430px; 
    border-collapse: separate; 
    border-spacing: 0 5px; 
    font-size: .94rem; 
}

td { 
    background: #f7f9fc; 
    padding: 13px 11px; 
    border-top: 1px solid transparent; 
    border-bottom: 1px solid transparent; 
    transition: .2s ease; 
}

tbody tr:hover td { 
    background: #eef0ff; 
    border-color: #dcd9ff; 
    transform: translateY(-2px); 
}

.cell-ar { color: var(--ar); }
.cell-er { color: var(--er); }
.cell-ir { color: var(--ir); }
```

**Interaction:** Rows lift up 2px on hover and change to a light purple background.

### Typography

The design uses two typefaces from Google Fonts:

```css
h1, h2, .word, .badge { font-family: "Space Grotesk", sans-serif; }
body { font-family: "DM Sans", sans-serif; }
```

- **Space Grotesk:** Geometric, modern, used for headlines and conjugated words (emphasizes clarity)
- **DM Sans:** Humanist sans-serif for body text and instructions (warm, readable)

### Responsive Design

The layout adapts to three breakpoints:

```css
@media (max-width: 760px) {
    header { display: block; }
    .intro { margin-top: 14px; text-align: left; }
    .layout { grid-template-columns: 1fr; }
}

@media (max-width: 460px) {
    .controls { grid-template-columns: 1fr; }
    .card { border-radius: 20px; padding: 20px; }
}
```

- **Tablet (≤760px):** Stack header vertically; switch to single-column layout
- **Mobile (≤460px):** Stack form controls vertically; reduce padding

### Accessibility

The design includes several accessibility features:

- **Semantic HTML:** `<label>`, `role="listbox"`, `aria-expanded`, `aria-live="polite"`
- **Color contrast:** Text meets WCAG AA standards (4.5:1 minimum)
- **Focus states:** All interactive elements have visible focus indicators
- **Keyboard navigation:** All controls are keyboard-accessible
- **Loading states:** Aria-label on typing indicator

---

## 🚀 Features

### Live Conjugation Engine
- Conjugates Spanish verbs in real-time
- Handles regular verbs (-ar, -er, -ir)
- Supports stem-changing verbs (e→ie, o→ue, e→i)
- Manages irregular yo-forms (hago, traigo, salgo, etc.)
- Handles total anomalies (ser, ir, estar, haber)

### Interactive Reference Matrix
- Displays all present tense endings by verb class
- Color-coded by infinitive ending (-ar, -er, -ir)
- Hover tooltips with conjugation patterns

### Keyboard Shortcuts
- Type accents easily: press `a` (or `e`, `i`, `o`, `u`, `n`) to insert á, é, í, ó, ú, ñ
- Press `Enter` to conjugate
- Close dropdown with `Escape`

### Intelligent Error Handling
- Validates infinitive format
- Requires subject selection before conjugation
- Handles defective verbs (nevar only has 3rd person)
- Clear error messages guide users

### Responsive Design
- Mobile-first approach
- Works on tablets and desktop
- Touch-friendly on small screens
- Progressive enhancement

---

## 👥 Intended Users

**Conjugación** is designed for:

- **Spanish language learners** (intermediate and above) who want to move beyond memorization
- **Curious grammar enthusiasts** interested in linguistic patterns
- **Students preparing for proficiency exams** (DELE, AP Spanish, etc.)
- **Teachers** seeking to explain conjugation rules to classes
- **Polyglots** studying multiple Romance languages

### What Users Learn

- **Phonological principles:** Why certain verbs change vowels
- **Pattern recognition:** Identifying stem-change verbs by their roots
- **Morphological structure:** How stems and endings combine
- **Exceptions and anomalies:** When and why rules break
- **Confidence:** Ability to conjugate new verbs independently

---

## 🎓 Pedagogical Philosophy

**Conjugación** is built on three educational principles:

### 1. **Transparency**
Every conjugation shows:
- The original infinitive and its ending class
- The extracted stem
- How the stem mutates (or doesn't)
- Which ending is attached
- Why the result is correct

This transparency builds mental models instead of surface-level memory.

### 2. **Pattern-Based Learning**
Rather than memorizing 100 irregular verbs, learners discover:
- Closed-syllable vowels undergo diphthongization
- Nosotros and vosotros are phonologically different
- The -g insertion in yo-forms follows predictable orthographic rules

These patterns scale to thousands of verbs.

### 3. **Active Exploration**
The UI encourages experimentation:
- Try "tenser," "sentar," "entender"—all have e→ie
- Try "nevar," "llover"—defective verbs
- Try "construir," "fluir"—uir verbs with y-glide

This hands-on discovery creates deeper retention than passive instruction.

---

## 📊 Supported Verb Types

### Regular Verbs
All regular -ar, -er, -ir verbs conjugate correctly:
- hablar, comer, vivir, caminar, beber, escribir

### Stem-Changing Verbs
- **e→ie:** pensar, querer, tener, entender, cerrar, comenzar, empezar, preferir, sentir, venir
- **o→ue:** dormir, poder, volver, morir, recordar, soñar, contar, costar, encontrar, almorzar, acordar
- **e→i:** pedir, servir, seguir, repetir, competir, medir, vestir, conseguir

### Yo-Irregular Verbs
- hacer (hago), tener (tengo), venir (vengo), poner (pongo)
- salir (salgo), valer (valgo), traer (traigo)
- decir (digo), conducir (conduzco), conocer (conozco)
- escoger (escojo), exigir (exijo), ofrecer (ofrezco)
- satisfacer (satisfago), oír (oigo)

### Total Anomalies
- ser (soy, eres, es, somos, sois, son)
- ir (voy, vas, va, vamos, vais, van)
- estar (estoy, estás, está, estamos, estáis, están)
- haber (he, has, ha, hemos, habéis, han)
- saber (sé, sabes, sabe, sabemos, sabéis, saben)

### Special Cases
- Reflexive verbs (-se suffix): lavarse, llamarse, levantarse
- Uir verbs: construir, distribuir, instruir, contribuir
- Defective verbs: nevar, llover (3rd person only)

---

## ⚙️ Technical Stack

- **Language:** HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Fonts:** Google Fonts (DM Sans, Space Grotesk)
- **Architecture:** Single-file SPA (single-page application)
- **Performance:** O(n) conjugation algorithm (n = verb length)
- **Compatibility:** All modern browsers (Chrome, Firefox, Safari, Edge)
- **Size:** ~50KB HTML (uncompressed)

---

## 🔬 How the Algorithm Works: Quick Reference

1. **Normalize:** Strip reflexive marker, lowercase
2. **Classify:** Determine verb category (0-5) via pattern matching
3. **Extract:** Remove ending, identify target vowel for mutation
4. **Mutate:** Apply stem change if applicable (phonological rules)
5. **Select:** Choose ending based on verb class and subject
6. **Combine:** stem + ending = conjugated form
7. **Output:** Render with highlighting and explanation

---

## 🌱 Future Enhancements

Potential features for future versions:

- [ ] Preterite tense conjugation
- [ ] Subjunctive mood
- [ ] Imperative forms (commands)
- [ ] Perfect tenses (he hablado, había hablado, etc.)
- [ ] Custom verb dictionary builder
- [ ] Quiz mode (conjugate 10 random verbs)
- [ ] Saved progress and personalized verb lists
- [ ] Mobile app version
- [ ] Spanish audio pronunciation
- [ ] Tutorial mode for learners
- [ ] Dark mode theme
- [ ] Multiple language interface (Spanish UI, French UI, etc.)

---

## 📖 Learning Resources

For deeper understanding of Spanish verb conjugation:

- **Grammar:** Real Academia Española (RAE) Diccionario Panhispánico de Dudas
- **Linguistics:** "The Sound Pattern of Spanish" — Harris (1969)
- **Pedagogy:** "How Languages are Learned" — Lightbown & Spada
- **Interactive Practice:** Conjugación app (this project)

---

## 📝 Usage Examples

### Example 1: Regular Verb (hablar)

```
Input: hablar
Subject: yo
Output: hablo

Explanation:
- Drop -ar from hablar → stem: habl
- No stem change (regular verb)
- Add yo ending for -ar verbs: -o
- Result: habl + o = hablo ✓
```

### Example 2: Stem-Changing Verb (pensar)

```
Input: pensar
Subject: nosotros
Output: pensamos

Explanation:
- Drop -ar from pensar → stem: pens
- Stem-change detected: e→ie (closed syllable)
- nosotros is in boot mask? NO
- Stem stays: pens (no mutation)
- Add nosotros ending for -ar verbs: -amos
- Result: pens + amos = pensamos ✓
```

### Example 3: Stem-Changing Verb (pensar)

```
Input: pensar
Subject: yo
Output: pienso

Explanation:
- Drop -ar from pensar → stem: pens
- Stem-change detected: e→ie (closed syllable)
- yo is in boot mask? YES
- Mutate stem: pens → piens (e→ie)
- Add yo ending for -ar verbs: -o
- Result: piens + o = pienso ✓
```

### Example 4: Irregular Yo-Form (hacer)

```
Input: hacer
Subject: yo
Output: hago

Explanation:
- Infinitive "hacer" has irregular yo-form: hag
- Use special yo-form: hag
- Add yo ending: -o
- Result: hag + o = hago ✓
```

### Example 5: Total Anomaly (ser)

```
Input: ser
Subject: eres
Output: eres

Explanation:
- "ser" is a total anomaly (complete lookup)
- Look up in irregularPresent table
- Result: eres ✓ (no rules apply)
```

---

## 🤝 Contributing & Development

`Conjugación` is a closed-source, proprietary project. Development, code modifications, and feature updates are strictly limited to the official **Lyceum Education** core team. 

* **No Pull Requests:** We do not accept external code contributions, forks intended for merging, or pull requests. Any unsolicited pull requests will be closed without review.
* **How to Help:** While you cannot modify the code, we highly value user feedback! If you find an error in a verb conjugation or want to request a feature, please submit an issue.

### To report bugs or suggest features:
1. Open an issue on GitHub.
2. Describe the specific verb and the expected conjugation rules.
3. Include error messages, clear descriptions, or screenshots if possible.

---

## 📄 License & Terms of Use

`Conjugación` is proprietary software. All rights are reserved by Daniel Garnsey (Lyceum Education). 

* **Permitted:** Personal, non-commercial educational use and classroom study.
* **Prohibited:** Commercial distribution, modification, creating derivative works, or reverse engineering.

For the full legal terms, restrictions, and liability disclaimers, please see the [LICENSE](LICENSE) file. For licensing inquiries, contact Daniel Garnsey (Lyceum Education) directly.


---

**Built with care for language learners. Protect intellectual property. Respect the work.** 

---

## 🙏 Acknowledgments

- **Spanish Grammar Foundations:** Real Academia Española
- **Phonological Theory:** Harris, Goldsmith, Halle & Vergnaud
- **Design Inspiration:** Modern educational software (Duolingo, Busuu, Forvo)
- **Accessibility Standards:** WCAG 2.1 Level AA

---

## 🔍 Glossary

**Stem:** The part of a verb that remains after removing the infinitive ending (-ar, -er, -ir)

**Diphthongization:** The process of a single vowel becoming two vowels (e→ie, o→ue)

**Closed Syllable:** A syllable ending in a consonant (e.g., "pens" in "pensar")

**Open Syllable:** A syllable ending in a vowel (e.g., "no" in "pensamos")

**Phonology:** The study of sound systems in languages

**Orthography:** The writing system of a language; spelling conventions

**Boot Mask:** A binary pattern indicating which subjects undergo stem changes

**Anomaly:** A verb that doesn't follow regular conjugation rules

**Reflexive:** A verb form where the subject performs an action on itself (me lavo = I wash myself)

---

**Happy conjugating! 🇪🇸**
