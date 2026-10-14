import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationPreference } from "./reputation-preference.js";

test("ReputationPreference starts in planned", () => {
  const item = newReputationPreference("code-19", "name-13");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationPreference moves to in progress", () => {
  const item = newReputationPreference("code-19", "name-13");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ReputationPreference rejects moves from cancelled", () => {
  const item = newReputationPreference("code-19", "name-13");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
