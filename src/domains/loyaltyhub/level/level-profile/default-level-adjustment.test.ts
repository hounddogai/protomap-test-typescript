import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultLevelAdjustment } from "./default-level-adjustment.js";

test("DefaultLevelAdjustment starts in open", () => {
  const item = newDefaultLevelAdjustment("code-959", "name-667");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultLevelAdjustment moves to in review", () => {
  const item = newDefaultLevelAdjustment("code-959", "name-667");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultLevelAdjustment rejects moves from archived", () => {
  const item = newDefaultLevelAdjustment("code-959", "name-667");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
