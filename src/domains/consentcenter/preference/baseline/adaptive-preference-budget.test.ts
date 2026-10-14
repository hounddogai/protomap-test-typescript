import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

test("AdaptivePreferenceBudget starts in draft", () => {
  const item = newAdaptivePreferenceBudget("code-926", "label-767");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePreferenceBudget moves to closed", () => {
  const item = newAdaptivePreferenceBudget("code-926", "label-767");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("AdaptivePreferenceBudget rejects moves from closed", () => {
  const item = newAdaptivePreferenceBudget("code-926", "label-767");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
