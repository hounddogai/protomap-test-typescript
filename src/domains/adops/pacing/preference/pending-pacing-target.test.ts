import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPacingTarget } from "./pending-pacing-target.js";

test("PendingPacingTarget starts in requested", () => {
  const item = newPendingPacingTarget("code-322", "name-792");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPacingTarget moves to revoked", () => {
  const item = newPendingPacingTarget("code-322", "name-792");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PendingPacingTarget rejects moves from expired", () => {
  const item = newPendingPacingTarget("code-322", "name-792");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
