import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedDeflectionBudget } from "./capped-deflection-budget.js";

test("CappedDeflectionBudget starts in planned", () => {
  const item = newCappedDeflectionBudget("code-674", "label-149");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedDeflectionBudget moves to scheduled", () => {
  const item = newCappedDeflectionBudget("code-674", "label-149");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CappedDeflectionBudget rejects moves from cancelled", () => {
  const item = newCappedDeflectionBudget("code-674", "label-149");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
