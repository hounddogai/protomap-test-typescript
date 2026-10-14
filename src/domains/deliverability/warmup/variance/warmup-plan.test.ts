import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupPlan } from "./warmup-plan.js";

test("WarmupPlan starts in open", () => {
  const item = newWarmupPlan("code-943", "name-984");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupPlan moves to in review", () => {
  const item = newWarmupPlan("code-943", "name-984");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WarmupPlan rejects moves from archived", () => {
  const item = newWarmupPlan("code-943", "name-984");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
