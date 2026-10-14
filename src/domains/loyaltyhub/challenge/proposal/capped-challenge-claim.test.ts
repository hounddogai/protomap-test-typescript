import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedChallengeClaim } from "./capped-challenge-claim.js";

test("CappedChallengeClaim starts in new", () => {
  const item = newCappedChallengeClaim("code-74", "name-57");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedChallengeClaim moves to running", () => {
  const item = newCappedChallengeClaim("code-74", "name-57");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("CappedChallengeClaim rejects moves from failed", () => {
  const item = newCappedChallengeClaim("code-74", "name-57");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
