import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintQuota } from "./complaint-quota.js";

test("ComplaintQuota starts in planned", () => {
  const item = newComplaintQuota("code-266", "name-865");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintQuota moves to in progress", () => {
  const item = newComplaintQuota("code-266", "name-865");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ComplaintQuota rejects moves from cancelled", () => {
  const item = newComplaintQuota("code-266", "name-865");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
