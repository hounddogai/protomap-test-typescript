import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFlightBudget } from "./rolling-flight-budget.js";

test("RollingFlightBudget starts in created", () => {
  const item = newRollingFlightBudget("code-3", "label-82");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFlightBudget moves to validated", () => {
  const item = newRollingFlightBudget("code-3", "label-82");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingFlightBudget rejects moves from retired", () => {
  const item = newRollingFlightBudget("code-3", "label-82");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
