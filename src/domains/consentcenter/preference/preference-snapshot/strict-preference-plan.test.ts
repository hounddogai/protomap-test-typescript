import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPreferencePlan } from "./strict-preference-plan.js";

test("StrictPreferencePlan starts in idle", () => {
  const item = newStrictPreferencePlan("code-741", "title-447");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPreferencePlan moves to stopped", () => {
  const item = newStrictPreferencePlan("code-741", "title-447");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("StrictPreferencePlan rejects moves from stopped", () => {
  const item = newStrictPreferencePlan("code-741", "title-447");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
