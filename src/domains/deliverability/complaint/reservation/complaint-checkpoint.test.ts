import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintCheckpoint } from "./complaint-checkpoint.js";

test("ComplaintCheckpoint starts in draft", () => {
  const item = newComplaintCheckpoint("code-367", "name-943");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintCheckpoint moves to suspended", () => {
  const item = newComplaintCheckpoint("code-367", "name-943");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ComplaintCheckpoint rejects moves from closed", () => {
  const item = newComplaintCheckpoint("code-367", "name-943");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
