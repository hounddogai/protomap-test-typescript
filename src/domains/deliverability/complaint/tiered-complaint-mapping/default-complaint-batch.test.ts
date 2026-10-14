import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultComplaintBatch } from "./default-complaint-batch.js";

test("DefaultComplaintBatch starts in draft", () => {
  const item = newDefaultComplaintBatch("code-859", "name-727");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultComplaintBatch moves to active", () => {
  const item = newDefaultComplaintBatch("code-859", "name-727");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("DefaultComplaintBatch rejects moves from closed", () => {
  const item = newDefaultComplaintBatch("code-859", "name-727");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
