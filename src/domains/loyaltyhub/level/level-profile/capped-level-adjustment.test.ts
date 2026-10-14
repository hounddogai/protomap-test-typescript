import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedLevelAdjustment } from "./capped-level-adjustment.js";

test("CappedLevelAdjustment starts in new", () => {
  const item = newCappedLevelAdjustment("code-832", "name-541");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedLevelAdjustment moves to queued", () => {
  const item = newCappedLevelAdjustment("code-832", "name-541");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedLevelAdjustment rejects moves from failed", () => {
  const item = newCappedLevelAdjustment("code-832", "name-541");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
