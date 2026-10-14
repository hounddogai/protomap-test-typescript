import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedEnrollmentDraft } from "./capped-enrollment-draft.js";

test("CappedEnrollmentDraft starts in idle", () => {
  const item = newCappedEnrollmentDraft("code-533", "label-3");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedEnrollmentDraft moves to warming", () => {
  const item = newCappedEnrollmentDraft("code-533", "label-3");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedEnrollmentDraft rejects moves from stopped", () => {
  const item = newCappedEnrollmentDraft("code-533", "label-3");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
