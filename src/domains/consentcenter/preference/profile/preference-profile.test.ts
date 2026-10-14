import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceProfile } from "./preference-profile.js";

test("PreferenceProfile starts in requested", () => {
  const item = newPreferenceProfile("code-106", "name-174");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceProfile moves to granted", () => {
  const item = newPreferenceProfile("code-106", "name-174");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PreferenceProfile rejects moves from expired", () => {
  const item = newPreferenceProfile("code-106", "name-174");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
