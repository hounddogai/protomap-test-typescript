import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalConversionBudget } from "./global-conversion-budget.js";

test("GlobalConversionBudget starts in created", () => {
  const item = newGlobalConversionBudget("code-581", "label-792");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalConversionBudget moves to validated", () => {
  const item = newGlobalConversionBudget("code-581", "label-792");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("GlobalConversionBudget rejects moves from retired", () => {
  const item = newGlobalConversionBudget("code-581", "label-792");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
