import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingTierAudit } from "./pending-tier-audit.js";

test("PendingTierAudit starts in idle", () => {
  const item = newPendingTierAudit("code-513", "title-567");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingTierAudit moves to warming", () => {
  const item = newPendingTierAudit("code-513", "title-567");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingTierAudit rejects moves from stopped", () => {
  const item = newPendingTierAudit("code-513", "title-567");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
