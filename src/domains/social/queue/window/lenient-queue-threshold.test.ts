import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientQueueThreshold } from "./lenient-queue-threshold.js";

test("LenientQueueThreshold starts in planned", () => {
  const item = newLenientQueueThreshold("code-81", "title-704");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientQueueThreshold moves to in progress", () => {
  const item = newLenientQueueThreshold("code-81", "title-704");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LenientQueueThreshold rejects moves from cancelled", () => {
  const item = newLenientQueueThreshold("code-81", "title-704");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
