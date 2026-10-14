import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalComplaintDraft } from "./global-complaint-draft.js";

test("GlobalComplaintDraft starts in draft", () => {
  const item = newGlobalComplaintDraft("code-687", "name-768");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalComplaintDraft moves to closed", () => {
  const item = newGlobalComplaintDraft("code-687", "name-768");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("GlobalComplaintDraft rejects moves from closed", () => {
  const item = newGlobalComplaintDraft("code-687", "name-768");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
