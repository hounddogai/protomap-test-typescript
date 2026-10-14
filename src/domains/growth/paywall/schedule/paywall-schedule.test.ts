import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallSchedule } from "./paywall-schedule.js";

test("PaywallSchedule starts in idle", () => {
  const item = newPaywallSchedule("code-3", "label-169");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallSchedule moves to ready", () => {
  const item = newPaywallSchedule("code-3", "label-169");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PaywallSchedule rejects moves from stopped", () => {
  const item = newPaywallSchedule("code-3", "label-169");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
