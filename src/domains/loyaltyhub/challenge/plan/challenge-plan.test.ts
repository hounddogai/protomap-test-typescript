import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengePlan } from "./challenge-plan.js";

test("ChallengePlan starts in planned", () => {
  const item = newChallengePlan("code-523", "name-636");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengePlan moves to in progress", () => {
  const item = newChallengePlan("code-523", "name-636");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ChallengePlan rejects moves from cancelled", () => {
  const item = newChallengePlan("code-523", "name-636");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
