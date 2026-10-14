import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredInviteAudit } from "./tiered-invite-audit.js";

test("TieredInviteAudit starts in planned", () => {
  const item = newTieredInviteAudit("code-469", "title-237");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredInviteAudit moves to in progress", () => {
  const item = newTieredInviteAudit("code-469", "title-237");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredInviteAudit rejects moves from cancelled", () => {
  const item = newTieredInviteAudit("code-469", "title-237");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
