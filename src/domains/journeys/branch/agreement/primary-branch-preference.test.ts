import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBranchPreference } from "./primary-branch-preference.js";

test("PrimaryBranchPreference starts in planned", () => {
  const item = newPrimaryBranchPreference("code-866", "name-660");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBranchPreference moves to cancelled", () => {
  const item = newPrimaryBranchPreference("code-866", "name-660");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PrimaryBranchPreference rejects moves from cancelled", () => {
  const item = newPrimaryBranchPreference("code-866", "name-660");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
