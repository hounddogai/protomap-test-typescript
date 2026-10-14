import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPreferenceOverride } from "./capped-preference-override.js";

test("CappedPreferenceOverride starts in created", () => {
  const item = newCappedPreferenceOverride("code-836", "title-287");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPreferenceOverride moves to retired", () => {
  const item = newCappedPreferenceOverride("code-836", "title-287");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CappedPreferenceOverride rejects moves from retired", () => {
  const item = newCappedPreferenceOverride("code-836", "title-287");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
