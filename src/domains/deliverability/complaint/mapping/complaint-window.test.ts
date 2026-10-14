import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintWindow } from "./complaint-window.js";

test("ComplaintWindow starts in planned", () => {
  const item = newComplaintWindow("code-210", "name-507");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintWindow moves to completed", () => {
  const item = newComplaintWindow("code-210", "name-507");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ComplaintWindow rejects moves from cancelled", () => {
  const item = newComplaintWindow("code-210", "name-507");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
