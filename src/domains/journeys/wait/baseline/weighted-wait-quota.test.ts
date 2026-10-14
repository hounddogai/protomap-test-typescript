import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWaitQuota } from "./weighted-wait-quota.js";

test("WeightedWaitQuota starts in proposed", () => {
  const item = newWeightedWaitQuota("code-436", "name-972");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWaitQuota moves to approved", () => {
  const item = newWeightedWaitQuota("code-436", "name-972");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedWaitQuota rejects moves from withdrawn", () => {
  const item = newWeightedWaitQuota("code-436", "name-972");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
