import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeMilestone } from "./challenge-milestone.js";

test("ChallengeMilestone starts in planned", () => {
  const item = newChallengeMilestone("code-39", "name-902");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeMilestone moves to completed", () => {
  const item = newChallengeMilestone("code-39", "name-902");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ChallengeMilestone rejects moves from cancelled", () => {
  const item = newChallengeMilestone("code-39", "name-902");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
