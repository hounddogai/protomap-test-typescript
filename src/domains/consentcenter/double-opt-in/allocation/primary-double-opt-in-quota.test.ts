import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDoubleOptInQuota } from "./primary-double-opt-in-quota.js";

test("PrimaryDoubleOptInQuota starts in requested", () => {
  const item = newPrimaryDoubleOptInQuota("code-62", "label-169");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDoubleOptInQuota moves to expired", () => {
  const item = newPrimaryDoubleOptInQuota("code-62", "label-169");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PrimaryDoubleOptInQuota rejects moves from expired", () => {
  const item = newPrimaryDoubleOptInQuota("code-62", "label-169");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
