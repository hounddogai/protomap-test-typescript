import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchPreference } from "./branch-preference.js";

test("BranchPreference starts in draft", () => {
  const item = newBranchPreference("code-268", "name-444");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchPreference moves to active", () => {
  const item = newBranchPreference("code-268", "name-444");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BranchPreference rejects moves from closed", () => {
  const item = newBranchPreference("code-268", "name-444");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
