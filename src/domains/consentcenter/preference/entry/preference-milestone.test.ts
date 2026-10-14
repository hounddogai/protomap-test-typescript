import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceMilestone } from "./preference-milestone.js";

test("PreferenceMilestone starts in open", () => {
  const item = newPreferenceMilestone("code-282", "name-517");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceMilestone moves to resolved", () => {
  const item = newPreferenceMilestone("code-282", "name-517");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PreferenceMilestone rejects moves from archived", () => {
  const item = newPreferenceMilestone("code-282", "name-517");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
