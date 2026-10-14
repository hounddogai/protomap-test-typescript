import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingStreakAudit } from "./pending-streak-audit.js";

test("PendingStreakAudit starts in idle", () => {
  const item = newPendingStreakAudit("code-632", "title-833");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingStreakAudit moves to draining", () => {
  const item = newPendingStreakAudit("code-632", "title-833");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PendingStreakAudit rejects moves from stopped", () => {
  const item = newPendingStreakAudit("code-632", "title-833");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
