import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWaitRequest } from "./scheduled-wait-request.js";

test("ScheduledWaitRequest starts in idle", () => {
  const item = newScheduledWaitRequest("code-803", "label-23");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWaitRequest moves to ready", () => {
  const item = newScheduledWaitRequest("code-803", "label-23");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ScheduledWaitRequest rejects moves from stopped", () => {
  const item = newScheduledWaitRequest("code-803", "label-23");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
