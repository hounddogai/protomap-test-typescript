import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceBaseline } from "./preference-baseline.js";

test("PreferenceBaseline starts in open", () => {
  const item = newPreferenceBaseline("code-863", "name-64");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceBaseline moves to resolved", () => {
  const item = newPreferenceBaseline("code-863", "name-64");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PreferenceBaseline rejects moves from archived", () => {
  const item = newPreferenceBaseline("code-863", "name-64");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
