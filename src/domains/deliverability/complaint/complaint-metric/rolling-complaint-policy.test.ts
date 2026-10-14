import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingComplaintPolicy } from "./rolling-complaint-policy.js";

test("RollingComplaintPolicy starts in requested", () => {
  const item = newRollingComplaintPolicy("code-978", "label-770");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingComplaintPolicy moves to revoked", () => {
  const item = newRollingComplaintPolicy("code-978", "label-770");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RollingComplaintPolicy rejects moves from expired", () => {
  const item = newRollingComplaintPolicy("code-978", "label-770");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
