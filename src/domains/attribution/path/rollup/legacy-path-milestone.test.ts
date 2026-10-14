import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPathMilestone } from "./legacy-path-milestone.js";

test("LegacyPathMilestone starts in new", () => {
  const item = newLegacyPathMilestone("code-49", "name-367");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPathMilestone moves to running", () => {
  const item = newLegacyPathMilestone("code-49", "name-367");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyPathMilestone rejects moves from failed", () => {
  const item = newLegacyPathMilestone("code-49", "name-367");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
