import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

test("DefaultPreferenceMilestone starts in open", () => {
  const item = newDefaultPreferenceMilestone("code-119", "title-342");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPreferenceMilestone moves to reopened", () => {
  const item = newDefaultPreferenceMilestone("code-119", "title-342");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("DefaultPreferenceMilestone rejects moves from archived", () => {
  const item = newDefaultPreferenceMilestone("code-119", "title-342");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
