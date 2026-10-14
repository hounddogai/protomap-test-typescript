import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBounceThreshold } from "./manual-bounce-threshold.js";

test("ManualBounceThreshold starts in draft", () => {
  const item = newManualBounceThreshold("code-897", "name-689");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBounceThreshold moves to pending", () => {
  const item = newManualBounceThreshold("code-897", "name-689");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ManualBounceThreshold rejects moves from closed", () => {
  const item = newManualBounceThreshold("code-897", "name-689");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
