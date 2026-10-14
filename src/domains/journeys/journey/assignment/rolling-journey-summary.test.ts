import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneySummary } from "./rolling-journey-summary.js";

test("RollingJourneySummary starts in open", () => {
  const item = newRollingJourneySummary("code-660", "name-622");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneySummary moves to resolved", () => {
  const item = newRollingJourneySummary("code-660", "name-622");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingJourneySummary rejects moves from archived", () => {
  const item = newRollingJourneySummary("code-660", "name-622");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
