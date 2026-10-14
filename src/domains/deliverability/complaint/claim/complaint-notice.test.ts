import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintNotice } from "./complaint-notice.js";

test("ComplaintNotice starts in open", () => {
  const item = newComplaintNotice("code-378", "name-819");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintNotice moves to resolved", () => {
  const item = newComplaintNotice("code-378", "name-819");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ComplaintNotice rejects moves from archived", () => {
  const item = newComplaintNotice("code-378", "name-819");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
