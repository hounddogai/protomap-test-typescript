import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalDraft } from "./approval-draft.js";

test("ApprovalDraft starts in new", () => {
  const item = newApprovalDraft("code-314", "title-987");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalDraft moves to queued", () => {
  const item = newApprovalDraft("code-314", "title-987");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ApprovalDraft rejects moves from failed", () => {
  const item = newApprovalDraft("code-314", "title-987");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
