import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWindowDraft } from "./legacy-window-draft.js";

test("LegacyWindowDraft starts in draft", () => {
  const item = newLegacyWindowDraft("code-995", "name-309");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWindowDraft moves to active", () => {
  const item = newLegacyWindowDraft("code-995", "name-309");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LegacyWindowDraft rejects moves from closed", () => {
  const item = newLegacyWindowDraft("code-995", "name-309");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
