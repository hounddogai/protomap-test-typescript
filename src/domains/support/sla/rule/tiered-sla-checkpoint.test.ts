import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

test("TieredSlaCheckpoint starts in planned", () => {
  const item = newTieredSlaCheckpoint("code-211", "title-411");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSlaCheckpoint moves to completed", () => {
  const item = newTieredSlaCheckpoint("code-211", "title-411");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredSlaCheckpoint rejects moves from cancelled", () => {
  const item = newTieredSlaCheckpoint("code-211", "title-411");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
