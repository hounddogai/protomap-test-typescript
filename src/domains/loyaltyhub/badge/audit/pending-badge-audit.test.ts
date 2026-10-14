import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBadgeAudit } from "./pending-badge-audit.js";

test("PendingBadgeAudit starts in requested", () => {
  const item = newPendingBadgeAudit("code-965", "title-598");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBadgeAudit moves to granted", () => {
  const item = newPendingBadgeAudit("code-965", "title-598");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingBadgeAudit rejects moves from expired", () => {
  const item = newPendingBadgeAudit("code-965", "title-598");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
