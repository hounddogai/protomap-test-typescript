import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationSegment } from "./activation-segment.js";

test("ActivationSegment starts in planned", () => {
  const item = newActivationSegment("code-922", "label-584");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationSegment moves to completed", () => {
  const item = newActivationSegment("code-922", "label-584");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ActivationSegment rejects moves from cancelled", () => {
  const item = newActivationSegment("code-922", "label-584");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
