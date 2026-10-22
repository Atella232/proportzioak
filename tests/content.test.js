import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../questions.js';
import { problems } from '../problems.js';

test('30 egoera bakar, 15 zuzenekoak eta 15 alderantzizkoak', () => {
  assert.equal(questions.length, 30);
  assert.equal(new Set(questions.map(q => q.id)).size, 30);
  assert.deepEqual(questions.map(q => q.id).sort((a, b) => a - b), Array.from({ length: 30 }, (_, i) => i + 1));
  assert.equal(questions.filter(q => q.type === 'direct').length, 15);
  assert.equal(questions.filter(q => q.type === 'inverse').length, 15);
});

for (const question of questions) {
  test(`${question.id}. ${question.title}: edukia eta adibide matematikoa`, () => {
    for (const key of ['category', 'title', 'prompt', 'explanation', 'exampleNote', 'constant']) {
      assert.equal(typeof question[key], 'string', key);
      assert.ok(question[key].trim().length > 0, key);
    }
    assert.ok(['direct', 'inverse'].includes(question.type));
    assert.equal(question.example.headers.length, 2);
    assert.equal(question.example.rows.length, 3);
    const constants = question.example.rows.map(row => {
      assert.equal(row.length, 2);
      const [x, y] = row;
      assert.equal(typeof x, 'number');
      assert.equal(typeof y, 'number');
      assert.ok(x > 0 && y > 0);
      return question.type === 'direct' ? y / x : x * y;
    });
    constants.forEach(k => assert.ok(Math.abs(k - constants[0]) < 1e-9, 'Zatidura edo biderkadura konstantea izan behar da'));
    assert.equal(new Set(question.example.rows.map(row => row[0])).size, 3);
  });
}

test('Egoera guztiek problema bana dute, gehigarririk gabe', () => {
  assert.deepEqual(Object.keys(problems).map(Number).sort((a, b) => a - b), questions.map(q => q.id).sort((a, b) => a - b));
});

for (const question of questions) {
  test(`${question.id}. problema: jatorrizko erlazioa eta unitatedun erantzuna`, () => {
    const problem = problems[question.id];
    for (const key of ['prompt', 'unit', 'result', 'relation']) {
      assert.equal(typeof problem[key], 'string', key);
      assert.ok(problem[key].trim().length > 0, key);
    }
    for (const key of ['knownX', 'knownY', 'targetX', 'answer']) {
      assert.ok(Number.isFinite(problem[key]) && problem[key] > 0, key);
    }
    assert.ok(Number.isInteger(problem.answer), 'Erantzuna zenbaki osoa izatea espero da');
    assert.ok(question.example.rows.some(([x, y]) => x === problem.knownX && y === problem.knownY), 'Abiapuntuko datuak adibidearekin bat datoz');
    assert.ok(question.example.rows.every(([x]) => x !== problem.targetX), 'Bilatu beharreko balioa ez dago jada adibidean');
    const [x, y] = question.example.rows[0];
    const expectedConstant = question.type === 'direct' ? y / x : x * y;
    const solvedConstant = question.type === 'direct' ? problem.answer / problem.targetX : problem.targetX * problem.answer;
    assert.ok(Math.abs(solvedConstant - expectedConstant) < 1e-9, 'Erantzunak jatorrizko zatidura edo biderkadura mantentzen du');
  });
}
