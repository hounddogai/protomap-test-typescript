import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredActivationSegment } from "./tiered-activation-segment.js";

test("TieredActivationSegment starts in new", () => {
  const item = newTieredActivationSegment("code-337", "label-967");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredActivationSegment moves to queued", () => {
  const item = newTieredActivationSegment("code-337", "label-967");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredActivationSegment rejects moves from failed", () => {
  const item = newTieredActivationSegment("code-337", "label-967");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
