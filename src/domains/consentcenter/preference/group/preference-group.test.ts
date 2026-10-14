import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceGroup } from "./preference-group.js";

test("PreferenceGroup starts in new", () => {
  const item = newPreferenceGroup("code-719", "title-587");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceGroup moves to queued", () => {
  const item = newPreferenceGroup("code-719", "title-587");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PreferenceGroup rejects moves from failed", () => {
  const item = newPreferenceGroup("code-719", "title-587");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
