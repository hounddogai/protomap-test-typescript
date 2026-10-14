import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneyRollup } from "./rolling-journey-rollup.js";

test("RollingJourneyRollup starts in new", () => {
  const item = newRollingJourneyRollup("code-567", "label-109");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneyRollup moves to done", () => {
  const item = newRollingJourneyRollup("code-567", "label-109");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RollingJourneyRollup rejects moves from failed", () => {
  const item = newRollingJourneyRollup("code-567", "label-109");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
