import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

test("AdaptiveInviteSchedule starts in idle", () => {
  const item = newAdaptiveInviteSchedule("code-988", "label-216");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveInviteSchedule moves to ready", () => {
  const item = newAdaptiveInviteSchedule("code-988", "label-216");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("AdaptiveInviteSchedule rejects moves from stopped", () => {
  const item = newAdaptiveInviteSchedule("code-988", "label-216");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
