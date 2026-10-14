import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRetentionAudit } from "./pending-retention-audit.js";

test("PendingRetentionAudit starts in proposed", () => {
  const item = newPendingRetentionAudit("code-565", "title-312");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRetentionAudit moves to approved", () => {
  const item = newPendingRetentionAudit("code-565", "title-312");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingRetentionAudit rejects moves from withdrawn", () => {
  const item = newPendingRetentionAudit("code-565", "title-312");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
