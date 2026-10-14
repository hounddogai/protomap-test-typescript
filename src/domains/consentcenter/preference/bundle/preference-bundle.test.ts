import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceBundle } from "./preference-bundle.js";

test("PreferenceBundle starts in new", () => {
  const item = newPreferenceBundle("code-222", "label-309");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceBundle moves to done", () => {
  const item = newPreferenceBundle("code-222", "label-309");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PreferenceBundle rejects moves from failed", () => {
  const item = newPreferenceBundle("code-222", "label-309");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
