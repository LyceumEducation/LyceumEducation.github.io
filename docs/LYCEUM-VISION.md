# Lyceum Education vision

Lyceum Education is an ecosystem of calm, evidence-informed tools that help
students understand, practice, and transfer knowledge, while helping educators
design and respond to learning more effectively.

**Conjugación** is the first product in that ecosystem. It is not a template
for unrelated apps; it is the first demonstration of Lyceum's product
standard: make hidden structure visible, explain the reasoning, and support
the learner's agency.

## Product thesis

Lyceum should optimize for durable learning rather than time-on-site,
streaks, or answer production. Every experience should help a learner do at
least one of the following:

- retrieve knowledge from memory;
- recognize and explain a pattern;
- apply an idea in a new context;
- diagnose and learn from an error;
- reflect on confidence and strategy; or
- create, revise, and communicate understanding.

The platform should use established learning science deliberately, including
retrieval practice, spaced practice, interleaving, feedback, metacognition,
transfer, cognitive-load management, and Universal Design for Learning. The
interface should make those choices understandable instead of presenting them
as opaque personalization.

## Ecosystem shape

Lyceum should be a hybrid ecosystem: focused products with shared identity,
accounts, learning data, and reusable activity infrastructure.

### Product families

1. **Language Lab** — Conjugación, vocabulary, reading, writing, listening,
   pronunciation, and grammar tools.
2. **Study Lab** — retrieval sessions, spaced review, concept maps, note
   transformation, self-explanation, and error analysis.
3. **Reading & Research Lab** — guided reading, annotation, evidence
   collection, source comparison, argument mapping, and research planning.
4. **Mathematics & Science Lab** — visual models, simulations, worked
   reasoning, misconception diagnosis, and data interpretation.
5. **Teaching Lab** — lesson planning, formative assessment, rubrics,
   feedback, small-group planning, and resource remixing.

New products should earn their place by solving a distinct learning or
teaching problem and by reusing shared primitives where that improves
coherence. The goal is not to ship a collection of disconnected utilities.

### Shared platform primitives

The platform roadmap should prioritize these foundations before broad
subject-area expansion:

- identity, roles, and age-appropriate permissions;
- learner goals, preferences, and consent;
- activities with explicit objectives and evidence tags;
- attempts, feedback, confidence, and revision history;
- mastery and retention signals that are explainable;
- educator-created assignments and groups;
- accessibility settings and localization;
- privacy, export, deletion, and retention controls.

Learning data should support the learner and educator, not become a
surveillance product. Analytics must be actionable, minimally collected, and
clear about uncertainty.

## UX principles

### Calm, purposeful surfaces

Use generous space, strong hierarchy, readable typography, and one primary
action per screen. Avoid notification noise, decorative complexity, and
gamification that competes with the learning task.

### Visible reasoning

Show patterns, steps, evidence, confidence, and misconceptions. A score alone
is not a useful explanation of learning.

### Progressive disclosure

Make the first interaction approachable, then reveal detail for learners who
want to inspect rules and for educators who need control. Expert capability
should not make the default experience intimidating.

### Productive error

Errors should identify what changed, why it matters, and what the learner can
try next. Feedback should preserve the learner's opportunity to think before
revealing an answer.

### Agency and accessibility

Learners should be able to choose goals, request hints, inspect explanations,
and control pacing. Keyboard access, screen-reader semantics, reduced motion,
contrast, localization, and touch support are core requirements for every
shared component.

## Brand direction

Lyceum should feel intellectual without being elitist, modern without being
disposable, and warm without becoming childish. The visual language should
suggest a place for inquiry: annotation, diagrams, margins, notebooks, and
structured conversation rather than trophies or arcade mechanics.

Conjugación already establishes a useful starting point:

- deep ink and light paper neutrals;
- violet as a distinctive primary accent;
- teal as a progress or active-state accent;
- rounded, focused workspaces;
- **Space Grotesk** for expressive headings;
- **DM Sans** for readable interface content.

Future products should extend this system through design tokens and shared
components, not invent a new visual identity for each lab. Product-specific
colors may identify subject domains, but interaction states, typography,
spacing, focus treatment, and accessibility behavior must remain consistent.

The voice should be precise, encouraging, and transparent:

- say what the system knows and what it is estimating;
- prefer specific guidance to generic praise;
- explain educational choices in plain language;
- never imply that automated feedback is teacher judgment.

## Responsible intelligence

Automation and AI may assist with hints, examples, practice generation,
feedback drafts, and teacher workflows. It must not quietly replace the
learner's reasoning or present uncertain content as authoritative.

Any intelligent feature should:

1. identify its purpose and limits;
2. preserve the learner's chance to attempt and revise;
3. expose or cite the basis of important claims;
4. allow educator review where classroom decisions are affected; and
5. collect only the data necessary for the feature.

## Delivery sequence

### Foundation

- Formalize the Lyceum design tokens and component patterns.
- Define shared identity, learner, educator, activity, and progress models.
- Add an evidence tag and objective to each learning activity.
- Improve Conjugación's explanations, accessibility, and error feedback.

### Language and study expansion

- Add vocabulary, reading, writing, and pronunciation experiences.
- Add retrieval sessions and spaced review around Conjugación content.
- Add educator assignments and learner progress views.

### Cross-subject labs

- Build reading/research capabilities, then mathematics and science
  explorations using the same activity and feedback primitives.
- Introduce teacher planning, rubrics, small-group support, and resource
  collections.

### Ecosystem

- Add institution-level capabilities only after privacy and permission
  boundaries are proven.
- Provide carefully scoped integrations and export APIs.
- Publish learning-design notes that explain the evidence behind major
  interaction patterns.

## Product decision filter

Before committing to a feature, ask:

1. What learning or teaching problem does it solve?
2. Which user is it for, and what is the primary action?
3. What evidence supports the proposed interaction?
4. How does it improve transfer, retention, or agency?
5. What does it do when its inference is wrong or uncertain?
6. Can it be accessible, privacy-preserving, and explainable?
7. Can it reuse shared Lyceum primitives without weakening the experience?

If these questions cannot be answered clearly, the feature belongs in
discovery, not production.
