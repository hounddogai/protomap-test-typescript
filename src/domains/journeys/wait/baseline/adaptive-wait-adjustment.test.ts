import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

test("AdaptiveWaitAdjustment starts in open", () => {
  const item = newAdaptiveWaitAdjustment("code-973", "name-187");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveWaitAdjustment moves to resolved", () => {
  const item = newAdaptiveWaitAdjustment("code-973", "name-187");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("AdaptiveWaitAdjustment rejects moves from archived", () => {
  const item = newAdaptiveWaitAdjustment("code-973", "name-187");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
