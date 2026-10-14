import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSenderPlan } from "./rolling-sender-plan.js";

test("RollingSenderPlan starts in planned", () => {
  const item = newRollingSenderPlan("code-794", "title-884");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSenderPlan moves to scheduled", () => {
  const item = newRollingSenderPlan("code-794", "title-884");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingSenderPlan rejects moves from cancelled", () => {
  const item = newRollingSenderPlan("code-794", "title-884");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
