import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDoubleOptInQuota } from "./tiered-double-opt-in-quota.js";

test("TieredDoubleOptInQuota starts in new", () => {
  const item = newTieredDoubleOptInQuota("code-199", "name-515");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDoubleOptInQuota moves to running", () => {
  const item = newTieredDoubleOptInQuota("code-199", "name-515");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TieredDoubleOptInQuota rejects moves from failed", () => {
  const item = newTieredDoubleOptInQuota("code-199", "name-515");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
