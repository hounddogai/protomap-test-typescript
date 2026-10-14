import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedActivationDigest } from "./weighted-activation-digest.js";

test("WeightedActivationDigest starts in new", () => {
  const item = newWeightedActivationDigest("code-575", "label-98");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedActivationDigest moves to queued", () => {
  const item = newWeightedActivationDigest("code-575", "label-98");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedActivationDigest rejects moves from failed", () => {
  const item = newWeightedActivationDigest("code-575", "label-98");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
