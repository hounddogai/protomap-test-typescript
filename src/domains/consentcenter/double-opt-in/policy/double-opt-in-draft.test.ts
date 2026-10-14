import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInDraft } from "./double-opt-in-draft.js";

test("DoubleOptInDraft starts in new", () => {
  const item = newDoubleOptInDraft("code-427", "label-538");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInDraft moves to running", () => {
  const item = newDoubleOptInDraft("code-427", "label-538");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DoubleOptInDraft rejects moves from failed", () => {
  const item = newDoubleOptInDraft("code-427", "label-538");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
