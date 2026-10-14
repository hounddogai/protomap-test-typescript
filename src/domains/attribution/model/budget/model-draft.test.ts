import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelDraft } from "./model-draft.js";

test("ModelDraft starts in proposed", () => {
  const item = newModelDraft("code-98", "title-23");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelDraft moves to rejected", () => {
  const item = newModelDraft("code-98", "title-23");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ModelDraft rejects moves from withdrawn", () => {
  const item = newModelDraft("code-98", "title-23");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
