import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

test("WeightedExitRuleCycle starts in draft", () => {
  const item = newWeightedExitRuleCycle("code-240", "title-355");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedExitRuleCycle moves to active", () => {
  const item = newWeightedExitRuleCycle("code-240", "title-355");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WeightedExitRuleCycle rejects moves from closed", () => {
  const item = newWeightedExitRuleCycle("code-240", "title-355");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
