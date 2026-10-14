import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPlacementAdjustment } from "./global-placement-adjustment.js";

test("GlobalPlacementAdjustment starts in open", () => {
  const item = newGlobalPlacementAdjustment("code-499", "title-68");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPlacementAdjustment moves to resolved", () => {
  const item = newGlobalPlacementAdjustment("code-499", "title-68");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("GlobalPlacementAdjustment rejects moves from archived", () => {
  const item = newGlobalPlacementAdjustment("code-499", "title-68");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
