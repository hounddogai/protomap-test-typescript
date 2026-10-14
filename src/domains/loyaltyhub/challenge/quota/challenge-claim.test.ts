import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeClaim } from "./challenge-claim.js";

test("ChallengeClaim starts in idle", () => {
  const item = newChallengeClaim("code-356", "label-513");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeClaim moves to warming", () => {
  const item = newChallengeClaim("code-356", "label-513");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ChallengeClaim rejects moves from stopped", () => {
  const item = newChallengeClaim("code-356", "label-513");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
