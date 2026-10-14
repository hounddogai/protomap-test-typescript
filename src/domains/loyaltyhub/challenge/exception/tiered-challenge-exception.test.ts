import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredChallengeException } from "./tiered-challenge-exception.js";

test("TieredChallengeException starts in planned", () => {
  const item = newTieredChallengeException("code-955", "title-339");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredChallengeException moves to cancelled", () => {
  const item = newTieredChallengeException("code-955", "title-339");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("TieredChallengeException rejects moves from cancelled", () => {
  const item = newTieredChallengeException("code-955", "title-339");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
