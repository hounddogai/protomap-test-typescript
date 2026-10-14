import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakPlan } from "./streak-plan.js";

test("StreakPlan starts in proposed", () => {
  const item = newStreakPlan("code-419", "title-458");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakPlan moves to rejected", () => {
  const item = newStreakPlan("code-419", "title-458");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("StreakPlan rejects moves from withdrawn", () => {
  const item = newStreakPlan("code-419", "title-458");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
