import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

test("RollingTouchpointSegment starts in idle", () => {
  const item = newRollingTouchpointSegment("code-772", "name-806");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingTouchpointSegment moves to draining", () => {
  const item = newRollingTouchpointSegment("code-772", "name-806");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RollingTouchpointSegment rejects moves from stopped", () => {
  const item = newRollingTouchpointSegment("code-772", "name-806");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
