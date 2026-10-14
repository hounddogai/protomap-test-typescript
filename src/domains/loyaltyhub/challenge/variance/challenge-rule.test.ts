import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeRule } from "./challenge-rule.js";

test("ChallengeRule starts in idle", () => {
  const item = newChallengeRule("code-939", "label-337");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeRule moves to warming", () => {
  const item = newChallengeRule("code-939", "label-337");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ChallengeRule rejects moves from stopped", () => {
  const item = newChallengeRule("code-939", "label-337");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
