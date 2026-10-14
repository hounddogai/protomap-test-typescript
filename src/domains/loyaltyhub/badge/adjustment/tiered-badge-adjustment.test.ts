import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

test("TieredBadgeAdjustment starts in open", () => {
  const item = newTieredBadgeAdjustment("code-356", "name-879");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBadgeAdjustment moves to resolved", () => {
  const item = newTieredBadgeAdjustment("code-356", "name-879");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TieredBadgeAdjustment rejects moves from archived", () => {
  const item = newTieredBadgeAdjustment("code-356", "name-879");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
