import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintThreshold } from "./complaint-threshold.js";

test("ComplaintThreshold starts in new", () => {
  const item = newComplaintThreshold("code-427", "label-560");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintThreshold moves to queued", () => {
  const item = newComplaintThreshold("code-427", "label-560");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ComplaintThreshold rejects moves from failed", () => {
  const item = newComplaintThreshold("code-427", "label-560");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
