import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingApprovalProfile } from "./rolling-approval-profile.js";

test("RollingApprovalProfile starts in requested", () => {
  const item = newRollingApprovalProfile("code-379", "label-740");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingApprovalProfile moves to granted", () => {
  const item = newRollingApprovalProfile("code-379", "label-740");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingApprovalProfile rejects moves from expired", () => {
  const item = newRollingApprovalProfile("code-379", "label-740");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
