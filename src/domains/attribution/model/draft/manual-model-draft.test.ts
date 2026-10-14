import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualModelDraft } from "./manual-model-draft.js";

test("ManualModelDraft starts in proposed", () => {
  const item = newManualModelDraft("code-17", "label-126");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualModelDraft moves to approved", () => {
  const item = newManualModelDraft("code-17", "label-126");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ManualModelDraft rejects moves from withdrawn", () => {
  const item = newManualModelDraft("code-17", "label-126");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
