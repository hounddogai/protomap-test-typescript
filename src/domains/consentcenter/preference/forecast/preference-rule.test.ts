import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceRule } from "./preference-rule.js";

test("PreferenceRule starts in idle", () => {
  const item = newPreferenceRule("code-84", "label-658");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceRule moves to ready", () => {
  const item = newPreferenceRule("code-84", "label-658");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PreferenceRule rejects moves from stopped", () => {
  const item = newPreferenceRule("code-84", "label-658");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
