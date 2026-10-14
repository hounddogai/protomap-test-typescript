import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveQueueTarget } from "./adaptive-queue-target.js";

test("AdaptiveQueueTarget starts in proposed", () => {
  const item = newAdaptiveQueueTarget("code-515", "title-296");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveQueueTarget moves to approved", () => {
  const item = newAdaptiveQueueTarget("code-515", "title-296");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveQueueTarget rejects moves from withdrawn", () => {
  const item = newAdaptiveQueueTarget("code-515", "title-296");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
