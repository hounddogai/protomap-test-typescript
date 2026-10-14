import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyBudget } from "./frequency-budget.js";

test("FrequencyBudget starts in requested", () => {
  const item = newFrequencyBudget("code-881", "title-769");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyBudget moves to granted", () => {
  const item = newFrequencyBudget("code-881", "title-769");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FrequencyBudget rejects moves from expired", () => {
  const item = newFrequencyBudget("code-881", "title-769");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
