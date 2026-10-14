import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceEntry } from "./preference-entry.js";

test("PreferenceEntry starts in open", () => {
  const item = newPreferenceEntry("code-160", "label-582");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceEntry moves to in review", () => {
  const item = newPreferenceEntry("code-160", "label-582");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PreferenceEntry rejects moves from archived", () => {
  const item = newPreferenceEntry("code-160", "label-582");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
