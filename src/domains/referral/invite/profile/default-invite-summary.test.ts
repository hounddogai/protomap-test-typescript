import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInviteSummary } from "./default-invite-summary.js";

test("DefaultInviteSummary starts in requested", () => {
  const item = newDefaultInviteSummary("code-31", "name-911");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInviteSummary moves to revoked", () => {
  const item = newDefaultInviteSummary("code-31", "name-911");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("DefaultInviteSummary rejects moves from expired", () => {
  const item = newDefaultInviteSummary("code-31", "name-911");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
