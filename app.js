import { questions } from './questions.js';
import { problems } from './problems.js';

const STORAGE_KEY = 'proportzioak.saioa.v1';
const labels = { direct: 'Proportzionaltasun zuzena', inverse: 'Alderantzizko proportzionaltasuna' };
const byId = new Map(questions.map(question => [question.id, question]));
const $ = selector => document.querySelector(selector);
const answerButtons = [...document.querySelectorAll('[data-answer]')];
let storageAvailable = true;
let showingResults = false;
let state = restore();

function freshState(shuffled = false) {
  const order = questions.map(question => question.id);
  if (shuffled) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return { version: 1, order, answers: {}, current: order[0] };
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return freshState();
    const validOrder = Array.isArray(saved.order) && saved.order.length === questions.length &&
      new Set(saved.order).size === questions.length && saved.order.every(id => byId.has(id));
    const validAnswers = saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers) &&
      Object.entries(saved.answers).every(([id, answer]) => byId.has(Number(id)) && ['direct', 'inverse'].includes(answer));
    if (saved.version === 1 && validOrder && validAnswers && byId.has(saved.current)) return saved;
  } catch { storageAvailable = false; }
  return freshState();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch { storageAvailable = false; }
  $('#save-note').textContent = storageAvailable
    ? '✓ Aurrerapena automatikoki gordetzen da.'
    : 'Saio honetako aurrerapena ez da gordeko nabigatzailea ixtean.';
}

function announce(message) {
  $('#announcer').textContent = message;
}

function totals() {
  const answered = Object.keys(state.answers).length;
  const correct = Object.entries(state.answers).filter(([id, answer]) => byId.get(Number(id)).type === answer).length;
  return { answered, correct, incorrect: answered - correct };
}

function updateProgress() {
  const { answered, correct, incorrect } = totals();
  $('#answered-count').textContent = answered;
  $('#correct-count').textContent = correct;
  $('#incorrect-count').textContent = incorrect;
  $('#progress').value = answered;
  $('#progress').textContent = `${answered} / ${questions.length}`;
  $('#results-button').hidden = answered !== questions.length;
  const fragment = document.createDocumentFragment();
  state.order.forEach((id, index) => {
    const button = document.createElement('button');
    const answer = state.answers[id];
    const correctAnswer = answer === byId.get(id).type;
    button.type = 'button';
    button.className = 'case-button';
    button.textContent = index + 1;
    const status = answer ? (correctAnswer ? 'zuzen erantzunda' : 'oker erantzunda') : 'erantzun gabe';
    button.setAttribute('aria-label', `${index + 1}. egoera: ${byId.get(id).title}, ${status}`);
    button.title = `${index + 1}. ${byId.get(id).title} · ${status}`;
    if (answer) button.classList.add(correctAnswer ? 'is-correct' : 'is-wrong');
    if (!showingResults && state.current === id) {
      button.classList.add('is-current');
      button.setAttribute('aria-current', 'step');
    }
    button.addEventListener('click', () => goTo(id));
    fragment.append(button);
  });
  $('#case-grid').replaceChildren(fragment);
}

function renderExample(question) {
  const table = $('#example-table');
  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = `${question.title}: bi magnitudeen balioen adibideak`;
  const head = document.createElement('thead');
  const header = document.createElement('tr');
  question.example.headers.forEach(text => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = text;
    header.append(cell);
  });
  head.append(header);
  const body = document.createElement('tbody');
  question.example.rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = typeof value === 'number' ? value.toLocaleString('eu-ES') : value;
      tr.append(cell);
    });
    body.append(tr);
  });
  table.replaceChildren(caption, head, body);
  $('#example-note').textContent = question.exampleNote;
  $('#constant').textContent = question.constant;
  renderProblem(question);
}

function renderProblem(question) {
  const problem = problems[question.id];
  const format = number => number.toLocaleString('eu-ES', { maximumFractionDigits: 6 });
  $('#problem-prompt').textContent = problem.prompt;
  $('#problem-solution').hidden = true;
  $('#solution-toggle').setAttribute('aria-expanded', 'false');
  $('#solution-toggle-label').textContent = 'Ikusi ebazpena pausoz pauso';
  $('#solution-toggle .toggle-symbol').textContent = '+';

  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = `${question.title}: problemaren datuak eta ezezaguna`;
  const head = document.createElement('thead');
  const header = document.createElement('tr');
  question.example.headers.forEach(label => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = label;
    header.append(cell);
  });
  head.append(header);
  const body = document.createElement('tbody');
  [[problem.knownX, problem.knownY], [problem.targetX, 'x']].forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = typeof value === 'number' ? format(value) : value;
      if (value === 'x') cell.className = 'unknown-value';
      tr.append(cell);
    });
    body.append(tr);
  });
  $('#problem-data').replaceChildren(caption, head, body);
  $('#problem-type').textContent = labels[question.type];
  $('#problem-relation').textContent = problem.relation;
  const direct = question.type === 'direct';
  $('#problem-method').textContent = direct
    ? 'Zuzeneko hiruko erregela: diagonalean biderkatu, eta ezagutzen dugun lehen magnitudearen balioaz zatitzen dugu.'
    : 'Alderantzizko hiruko erregela: ezagutzen dugun bikotearen bi balioak biderkatu, eta lehen magnitudearen balio berriaz zatitzen dugu.';
  const firstFactor = direct ? problem.targetX : problem.knownX;
  const divisor = direct ? problem.knownX : problem.targetX;
  const numerator = firstFactor * problem.knownY;
  const solution = numerator / divisor;
  $('#problem-calculation').textContent = `x = (${format(firstFactor)} × ${format(problem.knownY)}) / ${format(divisor)} = ${format(numerator)} / ${format(divisor)} = ${format(solution)} ${problem.unit}`;
  $('#problem-result').textContent = problem.result;
}

function toggleSolution() {
  const expanded = $('#solution-toggle').getAttribute('aria-expanded') !== 'true';
  $('#solution-toggle').setAttribute('aria-expanded', String(expanded));
  $('#problem-solution').hidden = !expanded;
  $('#solution-toggle-label').textContent = expanded ? 'Ezkutatu ebazpena' : 'Ikusi ebazpena pausoz pauso';
  $('#solution-toggle .toggle-symbol').textContent = expanded ? '−' : '+';
  if (expanded) announce(`Ebazpena erakutsi da. ${problems[state.current].result}`);
}

function renderQuestion(focus = false) {
  showingResults = false;
  const question = byId.get(state.current);
  const answer = state.answers[question.id];
  const index = state.order.indexOf(question.id);
  const correct = answer === question.type;
  $('#question-card').hidden = false;
  $('#results-card').hidden = true;
  $('#category').textContent = question.category;
  $('#case-count').textContent = `${String(index + 1).padStart(2, '0')} / 30`;
  $('#question-title').textContent = question.title;
  $('#question-prompt').textContent = question.prompt;
  answerButtons.forEach(button => {
    button.disabled = Boolean(answer);
    button.classList.remove('is-correct', 'is-wrong', 'is-muted');
    button.setAttribute('aria-pressed', String(answer === button.dataset.answer));
    if (answer) {
      button.classList.add(button.dataset.answer === question.type ? 'is-correct' :
        button.dataset.answer === answer ? 'is-wrong' : 'is-muted');
    }
  });
  $('#feedback').hidden = !answer;
  $('#next-button').hidden = !answer;
  if (answer) {
    $('#feedback').dataset.correct = String(correct);
    $('#feedback-symbol').textContent = correct ? '✓' : '×';
    $('#feedback-kicker').textContent = correct ? 'ONDO EGIN DUZU!' : 'ORAINGOAN EZ. IKAS DEZAGUN!';
    $('#feedback-title').textContent = labels[question.type];
    $('#explanation').textContent = question.explanation;
    renderExample(question);
    $('#question-hint').textContent = 'Irakurri azalpena, eta jarraitu ikasten.';
    $('#next-button').replaceChildren(document.createTextNode(totals().answered === questions.length ? 'Emaitzak ikusi ' : 'Hurrengoa '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    $('#next-button').append(arrow);
  } else {
    $('#question-hint').textContent = 'Aukeratu erantzun bat azalpena ikusteko.';
  }
  updateProgress();
  save();
  if (focus) {
    $('#question-title').focus({ preventScroll: true });
    scrollToPractice();
  }
}

function scrollToPractice() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#practice').scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
}

function goTo(id) {
  state.current = id;
  renderQuestion(true);
}

function answerQuestion(type) {
  if (showingResults || state.answers[state.current]) return;
  const question = byId.get(state.current);
  state.answers[state.current] = type;
  renderQuestion();
  announce(`${type === question.type ? 'Zuzena!' : 'Okerra.'} ${labels[question.type]}. ${question.explanation}`);
  // Answer controls become disabled after grading; keep keyboard focus useful.
  $('#next-button').focus({ preventScroll: true });
}

function nextQuestion() {
  if (totals().answered === questions.length) return showResults();
  const index = state.order.indexOf(state.current);
  const following = [...state.order.slice(index + 1), ...state.order.slice(0, index + 1)];
  goTo(following.find(id => !state.answers[id]));
}

function showResults() {
  const { answered, correct, incorrect } = totals();
  if (answered !== questions.length) return;
  showingResults = true;
  $('#question-card').hidden = true;
  $('#results-card').hidden = false;
  $('#results-score').replaceChildren(document.createTextNode(String(correct)));
  const denominator = document.createElement('span');
  denominator.textContent = ' / 30';
  $('#results-score').append(denominator);
  $('#results-title').textContent = correct === questions.length ? 'Lotura guztiak asmatu dituzu!' : 'Lotura guztiak aztertu dituzu.';
  $('#results-message').textContent = incorrect === 0 ? 'Bikain! Badakizu proportzionaltasun zuzena eta alderantzizkoa bereizten. Beste saio bat egin dezakezu egoerak nahastuta.' :
    `30 egoeretatik ${correct} zuzen erantzun dituzu. Errepasatu oker erantzundako egoerak, kontzeptuak hobeto ulertzeko.`;
  $('#mistake-review').hidden = incorrect === 0;
  const fragment = document.createDocumentFragment();
  state.order.forEach((id, index) => {
    if (state.answers[id] === byId.get(id).type) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${index + 1}. ${byId.get(id).title} ↗`;
    button.addEventListener('click', () => goTo(id));
    fragment.append(button);
  });
  $('#mistake-list').replaceChildren(fragment);
  updateProgress();
  $('#results-title').focus({ preventScroll: true });
  scrollToPractice();
  announce(`Saioa amaitu duzu: ${correct} erantzun zuzen 30etik.`);
}

function restart() {
  state = freshState(true);
  $('#restart-dialog').close();
  renderQuestion(true);
  announce('Saio berria hasi da. 30 egoerak nahastu ditugu.');
}

answerButtons.forEach(button => button.addEventListener('click', () => answerQuestion(button.dataset.answer)));
$('#next-button').addEventListener('click', nextQuestion);
$('#solution-toggle').addEventListener('click', toggleSolution);
$('#results-button').addEventListener('click', showResults);
document.querySelectorAll('[data-open-guide]').forEach(button => button.addEventListener('click', () => $('#guide-dialog').showModal()));
document.querySelectorAll('[data-restart]').forEach(button => button.addEventListener('click', () => {
  if (totals().answered === 0) restart();
  else $('#restart-dialog').showModal();
}));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#confirm-restart').addEventListener('click', restart);
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || document.querySelector('dialog[open]')) return;
  if (event.key === '1' || event.key === '2') {
    event.preventDefault();
    answerQuestion(event.key === '1' ? 'direct' : 'inverse');
  }
});

renderQuestion();
