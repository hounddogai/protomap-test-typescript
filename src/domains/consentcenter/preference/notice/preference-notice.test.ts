import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceNotice } from "./preference-notice.js";

test("PreferenceNotice starts in created", () => {
  const item = newPreferenceNotice("code-291", "name-475");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceNotice moves to validated", () => {
  const item = newPreferenceNotice("code-291", "name-475");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PreferenceNotice rejects moves from retired", () => {
  const item = newPreferenceNotice("code-291", "name-475");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
