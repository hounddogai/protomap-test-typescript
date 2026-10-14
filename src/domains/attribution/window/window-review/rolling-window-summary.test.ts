import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWindowSummary } from "./rolling-window-summary.js";

test("RollingWindowSummary starts in planned", () => {
  const item = newRollingWindowSummary("code-151", "name-761");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWindowSummary moves to scheduled", () => {
  const item = newRollingWindowSummary("code-151", "name-761");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingWindowSummary rejects moves from cancelled", () => {
  const item = newRollingWindowSummary("code-151", "name-761");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
