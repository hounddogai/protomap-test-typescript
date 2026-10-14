import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintAudit } from "./complaint-audit.js";

test("ComplaintAudit starts in planned", () => {
  const item = newComplaintAudit("code-247", "label-233");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintAudit moves to in progress", () => {
  const item = newComplaintAudit("code-247", "label-233");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ComplaintAudit rejects moves from cancelled", () => {
  const item = newComplaintAudit("code-247", "label-233");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
