import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCreditDigest } from "./weighted-credit-digest.js";

test("WeightedCreditDigest starts in planned", () => {
  const item = newWeightedCreditDigest("code-24", "title-117");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCreditDigest moves to scheduled", () => {
  const item = newWeightedCreditDigest("code-24", "title-117");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedCreditDigest rejects moves from cancelled", () => {
  const item = newWeightedCreditDigest("code-24", "title-117");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
