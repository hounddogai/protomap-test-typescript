import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierSchedule } from "./tier-schedule.js";

test("TierSchedule starts in idle", () => {
  const item = newTierSchedule("code-864", "name-433");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierSchedule moves to draining", () => {
  const item = newTierSchedule("code-864", "name-433");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TierSchedule rejects moves from stopped", () => {
  const item = newTierSchedule("code-864", "name-433");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
