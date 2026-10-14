import assert from "node:assert/strict";
import { test } from "node:test";
import { newLevelPlan } from "./level-plan.js";

test("LevelPlan starts in draft", () => {
  const item = newLevelPlan("code-924", "label-404");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LevelPlan moves to active", () => {
  const item = newLevelPlan("code-924", "label-404");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LevelPlan rejects moves from closed", () => {
  const item = newLevelPlan("code-924", "label-404");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
