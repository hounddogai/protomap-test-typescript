import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintDraft } from "./complaint-draft.js";

test("ComplaintDraft starts in new", () => {
  const item = newComplaintDraft("code-484", "name-261");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintDraft moves to running", () => {
  const item = newComplaintDraft("code-484", "name-261");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ComplaintDraft rejects moves from failed", () => {
  const item = newComplaintDraft("code-484", "name-261");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
