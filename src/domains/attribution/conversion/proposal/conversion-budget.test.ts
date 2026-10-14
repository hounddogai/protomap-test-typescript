import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionBudget } from "./conversion-budget.js";

test("ConversionBudget starts in proposed", () => {
  const item = newConversionBudget("code-972", "name-644");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionBudget moves to approved", () => {
  const item = newConversionBudget("code-972", "name-644");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ConversionBudget rejects moves from withdrawn", () => {
  const item = newConversionBudget("code-972", "name-644");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
