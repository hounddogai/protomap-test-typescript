import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualOptOutQuota } from "./manual-opt-out-quota.js";

test("ManualOptOutQuota starts in requested", () => {
  const item = newManualOptOutQuota("code-983", "label-22");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualOptOutQuota moves to revoked", () => {
  const item = newManualOptOutQuota("code-983", "label-22");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ManualOptOutQuota rejects moves from expired", () => {
  const item = newManualOptOutQuota("code-983", "label-22");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
