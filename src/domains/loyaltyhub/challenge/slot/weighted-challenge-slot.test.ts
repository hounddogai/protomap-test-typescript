import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedChallengeSlot } from "./weighted-challenge-slot.js";

test("WeightedChallengeSlot starts in requested", () => {
  const item = newWeightedChallengeSlot("code-234", "label-895");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedChallengeSlot moves to expired", () => {
  const item = newWeightedChallengeSlot("code-234", "label-895");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedChallengeSlot rejects moves from expired", () => {
  const item = newWeightedChallengeSlot("code-234", "label-895");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
