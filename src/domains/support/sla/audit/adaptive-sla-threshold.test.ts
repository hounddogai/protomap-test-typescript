import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

test("AdaptiveSlaThreshold starts in draft", () => {
  const item = newAdaptiveSlaThreshold("code-358", "name-94");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSlaThreshold moves to pending", () => {
  const item = newAdaptiveSlaThreshold("code-358", "name-94");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveSlaThreshold rejects moves from closed", () => {
  const item = newAdaptiveSlaThreshold("code-358", "name-94");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
