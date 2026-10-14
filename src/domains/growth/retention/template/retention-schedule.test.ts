import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionSchedule } from "./retention-schedule.js";

test("RetentionSchedule starts in idle", () => {
  const item = newRetentionSchedule("code-667", "label-244");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionSchedule moves to warming", () => {
  const item = newRetentionSchedule("code-667", "label-244");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RetentionSchedule rejects moves from stopped", () => {
  const item = newRetentionSchedule("code-667", "label-244");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
