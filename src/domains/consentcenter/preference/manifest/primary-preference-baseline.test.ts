import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

test("PrimaryPreferenceBaseline starts in new", () => {
  const item = newPrimaryPreferenceBaseline("code-563", "title-910");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPreferenceBaseline moves to queued", () => {
  const item = newPrimaryPreferenceBaseline("code-563", "title-910");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PrimaryPreferenceBaseline rejects moves from failed", () => {
  const item = newPrimaryPreferenceBaseline("code-563", "title-910");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
