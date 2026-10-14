import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPreferenceGroup } from "./tiered-preference-group.js";

test("TieredPreferenceGroup starts in idle", () => {
  const item = newTieredPreferenceGroup("code-876", "label-80");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPreferenceGroup moves to ready", () => {
  const item = newTieredPreferenceGroup("code-876", "label-80");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredPreferenceGroup rejects moves from stopped", () => {
  const item = newTieredPreferenceGroup("code-876", "label-80");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
