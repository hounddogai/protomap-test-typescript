import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferencePolicy } from "./preference-policy.js";

test("PreferencePolicy starts in requested", () => {
  const item = newPreferencePolicy("code-218", "name-722");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferencePolicy moves to granted", () => {
  const item = newPreferencePolicy("code-218", "name-722");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PreferencePolicy rejects moves from expired", () => {
  const item = newPreferencePolicy("code-218", "name-722");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
