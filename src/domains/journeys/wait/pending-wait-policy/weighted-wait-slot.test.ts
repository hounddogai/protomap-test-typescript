import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWaitSlot } from "./weighted-wait-slot.js";

test("WeightedWaitSlot starts in open", () => {
  const item = newWeightedWaitSlot("code-887", "label-300");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWaitSlot moves to resolved", () => {
  const item = newWeightedWaitSlot("code-887", "label-300");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WeightedWaitSlot rejects moves from archived", () => {
  const item = newWeightedWaitSlot("code-887", "label-300");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
