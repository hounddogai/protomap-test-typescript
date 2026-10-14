import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBounceDraft } from "./manual-bounce-draft.js";

test("ManualBounceDraft starts in created", () => {
  const item = newManualBounceDraft("code-136", "title-160");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBounceDraft moves to retired", () => {
  const item = newManualBounceDraft("code-136", "title-160");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ManualBounceDraft rejects moves from retired", () => {
  const item = newManualBounceDraft("code-136", "title-160");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
