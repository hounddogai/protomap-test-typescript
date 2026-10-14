import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictOptOutDraft } from "./strict-opt-out-draft.js";

test("StrictOptOutDraft starts in draft", () => {
  const item = newStrictOptOutDraft("code-166", "title-791");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictOptOutDraft moves to suspended", () => {
  const item = newStrictOptOutDraft("code-166", "title-791");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("StrictOptOutDraft rejects moves from closed", () => {
  const item = newStrictOptOutDraft("code-166", "title-791");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
