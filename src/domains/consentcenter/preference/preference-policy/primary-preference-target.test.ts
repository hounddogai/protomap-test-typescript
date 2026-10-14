import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPreferenceTarget } from "./primary-preference-target.js";

test("PrimaryPreferenceTarget starts in planned", () => {
  const item = newPrimaryPreferenceTarget("code-757", "title-250");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPreferenceTarget moves to in progress", () => {
  const item = newPrimaryPreferenceTarget("code-757", "title-250");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PrimaryPreferenceTarget rejects moves from cancelled", () => {
  const item = newPrimaryPreferenceTarget("code-757", "title-250");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
