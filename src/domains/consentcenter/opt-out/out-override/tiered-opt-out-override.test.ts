import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredOptOutOverride } from "./tiered-opt-out-override.js";

test("TieredOptOutOverride starts in planned", () => {
  const item = newTieredOptOutOverride("code-165", "name-805");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredOptOutOverride moves to in progress", () => {
  const item = newTieredOptOutOverride("code-165", "name-805");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TieredOptOutOverride rejects moves from cancelled", () => {
  const item = newTieredOptOutOverride("code-165", "name-805");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
