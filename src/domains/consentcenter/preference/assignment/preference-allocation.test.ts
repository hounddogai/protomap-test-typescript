import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceAllocation } from "./preference-allocation.js";

test("PreferenceAllocation starts in open", () => {
  const item = newPreferenceAllocation("code-768", "name-216");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceAllocation moves to reopened", () => {
  const item = newPreferenceAllocation("code-768", "name-216");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PreferenceAllocation rejects moves from archived", () => {
  const item = newPreferenceAllocation("code-768", "name-216");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
