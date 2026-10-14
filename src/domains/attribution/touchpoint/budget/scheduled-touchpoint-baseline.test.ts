import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

test("ScheduledTouchpointBaseline starts in idle", () => {
  const item = newScheduledTouchpointBaseline("code-217", "label-288");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTouchpointBaseline moves to warming", () => {
  const item = newScheduledTouchpointBaseline("code-217", "label-288");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ScheduledTouchpointBaseline rejects moves from stopped", () => {
  const item = newScheduledTouchpointBaseline("code-217", "label-288");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
