import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeAdjustment } from "./challenge-adjustment.js";

test("ChallengeAdjustment starts in requested", () => {
  const item = newChallengeAdjustment("code-157", "name-419");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeAdjustment moves to expired", () => {
  const item = newChallengeAdjustment("code-157", "name-419");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ChallengeAdjustment rejects moves from expired", () => {
  const item = newChallengeAdjustment("code-157", "name-419");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
