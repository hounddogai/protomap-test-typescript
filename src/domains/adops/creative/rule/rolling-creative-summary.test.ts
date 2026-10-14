import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingCreativeSummary } from "./rolling-creative-summary.js";

test("RollingCreativeSummary starts in planned", () => {
  const item = newRollingCreativeSummary("code-813", "title-203");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingCreativeSummary moves to scheduled", () => {
  const item = newRollingCreativeSummary("code-813", "title-203");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RollingCreativeSummary rejects moves from cancelled", () => {
  const item = newRollingCreativeSummary("code-813", "title-203");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
