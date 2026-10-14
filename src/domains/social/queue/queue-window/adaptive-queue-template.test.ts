import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveQueueTemplate } from "./adaptive-queue-template.js";

test("AdaptiveQueueTemplate starts in planned", () => {
  const item = newAdaptiveQueueTemplate("code-756", "label-858");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveQueueTemplate moves to scheduled", () => {
  const item = newAdaptiveQueueTemplate("code-756", "label-858");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveQueueTemplate rejects moves from cancelled", () => {
  const item = newAdaptiveQueueTemplate("code-756", "label-858");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
