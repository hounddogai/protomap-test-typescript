import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingComplaintAudit } from "./pending-complaint-audit.js";

test("PendingComplaintAudit starts in proposed", () => {
  const item = newPendingComplaintAudit("code-542", "label-539");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingComplaintAudit moves to approved", () => {
  const item = newPendingComplaintAudit("code-542", "label-539");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingComplaintAudit rejects moves from withdrawn", () => {
  const item = newPendingComplaintAudit("code-542", "label-539");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
