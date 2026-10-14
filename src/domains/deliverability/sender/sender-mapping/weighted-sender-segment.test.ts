import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedSenderSegment } from "./weighted-sender-segment.js";

test("WeightedSenderSegment starts in planned", () => {
  const item = newWeightedSenderSegment("code-913", "label-958");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedSenderSegment moves to scheduled", () => {
  const item = newWeightedSenderSegment("code-913", "label-958");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedSenderSegment rejects moves from cancelled", () => {
  const item = newWeightedSenderSegment("code-913", "label-958");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
