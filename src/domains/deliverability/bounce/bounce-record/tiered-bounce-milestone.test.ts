import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBounceMilestone } from "./tiered-bounce-milestone.js";

test("TieredBounceMilestone starts in planned", () => {
  const item = newTieredBounceMilestone("code-893", "name-803");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBounceMilestone moves to in progress", () => {
  const item = newTieredBounceMilestone("code-893", "name-803");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredBounceMilestone rejects moves from cancelled", () => {
  const item = newTieredBounceMilestone("code-893", "name-803");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
