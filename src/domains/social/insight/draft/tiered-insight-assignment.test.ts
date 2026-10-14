import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredInsightAssignment } from "./tiered-insight-assignment.js";

test("TieredInsightAssignment starts in idle", () => {
  const item = newTieredInsightAssignment("code-758", "title-883");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredInsightAssignment moves to draining", () => {
  const item = newTieredInsightAssignment("code-758", "title-883");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredInsightAssignment rejects moves from stopped", () => {
  const item = newTieredInsightAssignment("code-758", "title-883");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
