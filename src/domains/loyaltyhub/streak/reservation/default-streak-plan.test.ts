import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultStreakPlan } from "./default-streak-plan.js";

test("DefaultStreakPlan starts in open", () => {
  const item = newDefaultStreakPlan("code-551", "name-315");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultStreakPlan moves to in review", () => {
  const item = newDefaultStreakPlan("code-551", "name-315");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultStreakPlan rejects moves from archived", () => {
  const item = newDefaultStreakPlan("code-551", "name-315");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
