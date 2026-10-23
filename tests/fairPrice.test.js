/* Run with: node --test tests/fairPrice.test.js
   Pulls the fairPrice module straight out of index.html so the app stays single file. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\* FAIRPRICE:START[\s\S]*?\*\/([\s\S]*?)\/\* FAIRPRICE:END \*\//);
assert.ok(m, 'FAIRPRICE block not found in index.html');
const fairPrice = new Function(m[1] + '\nreturn fairPrice;')();

const METHODS = fairPrice.METHODS.map(x => x.key);
const sum = a => a.reduce((x, y) => x + y, 0);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b}, got ${a}`);

test('there are four methods and Shin is first (the default)', () => {
  assert.deepEqual(METHODS.slice().sort(), ['additive', 'multiplicative', 'power', 'shin']);
  assert.equal(METHODS[0], 'shin');
});

test('Shin on decimal odds 2.6, 2.4, 4.3 matches the shin README', () => {
  const p = fairPrice.fromDecimal([2.6, 2.4, 4.3], 'shin');
  near(p[0], 0.3730, 5e-4, 'home');
  near(p[1], 0.4048, 5e-4, 'draw');
  near(p[2], 0.2222, 5e-4, 'away');
});

test('every method sums to 1 for 2, 3 and 5 outcome markets', () => {
  const sets = [
    [-110, -110], [-250, 205], [-1500, 800], [105, -125],
    [180, 220, 150], [-120, 260, 340],
    [300, 450, 600, 900, 1200],
  ];
  for (const odds of sets) for (const method of METHODS) {
    const p = fairPrice.fromAmerican(odds, method);
    near(sum(p), 1, 1e-9, `${method} ${odds}`);
    assert.ok(p.every(x => x > 0 && x < 1), `${method} ${odds} probabilities in (0,1)`);
  }
});

test('even money both ways is 50/50 under every method', () => {
  for (const method of METHODS) {
    const p = fairPrice.fromAmerican([-110, -110], method);
    near(p[0], 0.5, 1e-12, method); near(p[1], 0.5, 1e-12, method);
  }
});

test('multiplicative divides by the book sum (the pre existing noVig)', () => {
  const pa = 110 / 210, pb = 110 / 210, p = fairPrice.fromAmerican([-110, -110], 'multiplicative');
  near(p[0], pa / (pa + pb), 1e-12);
  const q = fairPrice.fromAmerican([-250, 205], 'multiplicative'), a = 250 / 350, b = 100 / 305;
  near(q[0], a / (a + b), 1e-12);
});

test('additive removes an equal share of the margin', () => {
  const imp = [0.55, 0.50], p = fairPrice.additive(imp);
  near(p[0], 0.525, 1e-12); near(p[1], 0.475, 1e-12);
});

test('power finds k so the powered probabilities sum to 1', () => {
  const imp = [0.6, 0.5], r = fairPrice.power(imp);
  assert.ok(r.k > 1);
  near(sum(imp.map(x => Math.pow(x, r.k))), 1, 1e-9);
});

test('two way Shin closed form satisfies the Shin equation', () => {
  const two = fairPrice.shin([0.56, 0.52]).p;
  assert.ok(two[0] > two[1]);
  near(sum(two), 1, 1e-12);
  const imp = [0.56, 0.52], B = sum(imp), z = fairPrice.shinZ(imp);
  const q = imp.map(x => (Math.sqrt(z * z + 4 * (1 - z) * x * x / B) - z) / (2 * (1 - z)));
  near(sum(q), 1, 1e-9, 'sum of Shin probabilities at the closed form z');
});

test('Shin shifts more vig onto the longshot than multiplicative does', () => {
  const imp = [1 / 1.2, 1 / 5.5]; // heavy favourite and longshot, with vig
  const s = fairPrice.shin(imp).p, mu = fairPrice.multiplicative(imp);
  assert.ok(s[1] < mu[1], 'longshot gets a smaller fair share under Shin');
});

test('no vig book comes back unchanged', () => {
  for (const method of METHODS) {
    const p = fairPrice.devig([0.7, 0.3], method);
    near(p[0], 0.7, 1e-9, method); near(p[1], 0.3, 1e-9, method);
  }
});

test('worst case picks the lowest value', () => {
  assert.equal(fairPrice.worst([0.31, 0.29, 0.33, 0.3]), 0.29);
});
