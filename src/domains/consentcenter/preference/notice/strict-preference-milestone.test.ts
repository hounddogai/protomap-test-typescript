import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPreferenceMilestone } from "./strict-preference-milestone.js";

test("StrictPreferenceMilestone starts in new", () => {
  const item = newStrictPreferenceMilestone("code-568", "name-413");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPreferenceMilestone moves to running", () => {
  const item = newStrictPreferenceMilestone("code-568", "name-413");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictPreferenceMilestone rejects moves from failed", () => {
  const item = newStrictPreferenceMilestone("code-568", "name-413");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
