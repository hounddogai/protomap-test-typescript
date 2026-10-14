import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierItem } from "./tier-item.js";

test("TierItem starts in new", () => {
  const item = newTierItem("code-906", "name-171");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierItem moves to failed", () => {
  const item = newTierItem("code-906", "name-171");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TierItem rejects moves from failed", () => {
  const item = newTierItem("code-906", "name-171");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
