import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingPlan } from "./pacing-plan.js";

test("PacingPlan starts in open", () => {
  const item = newPacingPlan("code-421", "label-12");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingPlan moves to in review", () => {
  const item = newPacingPlan("code-421", "label-12");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PacingPlan rejects moves from archived", () => {
  const item = newPacingPlan("code-421", "label-12");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
