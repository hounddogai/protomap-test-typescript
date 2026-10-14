import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceDraft } from "./preference-draft.js";

test("PreferenceDraft starts in proposed", () => {
  const item = newPreferenceDraft("code-59", "label-362");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceDraft moves to rejected", () => {
  const item = newPreferenceDraft("code-59", "label-362");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PreferenceDraft rejects moves from withdrawn", () => {
  const item = newPreferenceDraft("code-59", "label-362");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
