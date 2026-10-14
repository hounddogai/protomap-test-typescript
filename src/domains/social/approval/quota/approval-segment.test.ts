import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalSegment } from "./approval-segment.js";

test("ApprovalSegment starts in requested", () => {
  const item = newApprovalSegment("code-203", "name-288");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalSegment moves to expired", () => {
  const item = newApprovalSegment("code-203", "name-288");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ApprovalSegment rejects moves from expired", () => {
  const item = newApprovalSegment("code-203", "name-288");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
