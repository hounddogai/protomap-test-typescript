import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceTarget } from "./preference-target.js";

test("PreferenceTarget starts in new", () => {
  const item = newPreferenceTarget("code-383", "label-313");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceTarget moves to done", () => {
  const item = newPreferenceTarget("code-383", "label-313");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PreferenceTarget rejects moves from failed", () => {
  const item = newPreferenceTarget("code-383", "label-313");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
