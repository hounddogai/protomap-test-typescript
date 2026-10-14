import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepDraft } from "./step-draft.js";

test("StepDraft starts in open", () => {
  const item = newStepDraft("code-983", "label-486");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepDraft moves to resolved", () => {
  const item = newStepDraft("code-983", "label-486");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StepDraft rejects moves from archived", () => {
  const item = newStepDraft("code-983", "label-486");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
