import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

test("ScheduledWaitCycle starts in idle", () => {
  const item = newScheduledWaitCycle("code-667", "title-389");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledWaitCycle moves to warming", () => {
  const item = newScheduledWaitCycle("code-667", "title-389");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ScheduledWaitCycle rejects moves from stopped", () => {
  const item = newScheduledWaitCycle("code-667", "title-389");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
