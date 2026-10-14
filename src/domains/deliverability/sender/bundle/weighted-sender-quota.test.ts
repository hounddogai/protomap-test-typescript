import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedSenderQuota } from "./weighted-sender-quota.js";

test("WeightedSenderQuota starts in created", () => {
  const item = newWeightedSenderQuota("code-297", "title-506");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedSenderQuota moves to retired", () => {
  const item = newWeightedSenderQuota("code-297", "title-506");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("WeightedSenderQuota rejects moves from retired", () => {
  const item = newWeightedSenderQuota("code-297", "title-506");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
