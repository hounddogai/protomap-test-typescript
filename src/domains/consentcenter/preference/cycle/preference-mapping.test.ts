import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceMapping } from "./preference-mapping.js";

test("PreferenceMapping starts in created", () => {
  const item = newPreferenceMapping("code-777", "name-352");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceMapping moves to retired", () => {
  const item = newPreferenceMapping("code-777", "name-352");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PreferenceMapping rejects moves from retired", () => {
  const item = newPreferenceMapping("code-777", "name-352");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
