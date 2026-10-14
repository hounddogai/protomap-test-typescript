import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceException } from "./preference-exception.js";

test("PreferenceException starts in idle", () => {
  const item = newPreferenceException("code-371", "title-546");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceException moves to draining", () => {
  const item = newPreferenceException("code-371", "title-546");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PreferenceException rejects moves from stopped", () => {
  const item = newPreferenceException("code-371", "title-546");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
