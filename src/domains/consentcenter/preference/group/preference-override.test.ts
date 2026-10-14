import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceOverride } from "./preference-override.js";

test("PreferenceOverride starts in open", () => {
  const item = newPreferenceOverride("code-751", "label-821");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceOverride moves to resolved", () => {
  const item = newPreferenceOverride("code-751", "label-821");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PreferenceOverride rejects moves from archived", () => {
  const item = newPreferenceOverride("code-751", "label-821");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
