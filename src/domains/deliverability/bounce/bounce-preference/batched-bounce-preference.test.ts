import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBouncePreference } from "./batched-bounce-preference.js";

test("BatchedBouncePreference starts in requested", () => {
  const item = newBatchedBouncePreference("code-443", "label-699");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBouncePreference moves to granted", () => {
  const item = newBatchedBouncePreference("code-443", "label-699");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedBouncePreference rejects moves from expired", () => {
  const item = newBatchedBouncePreference("code-443", "label-699");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
