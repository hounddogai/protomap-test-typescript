import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

test("RollingJourneyBaseline starts in created", () => {
  const item = newRollingJourneyBaseline("code-208", "title-987");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneyBaseline moves to retired", () => {
  const item = newRollingJourneyBaseline("code-208", "title-987");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("RollingJourneyBaseline rejects moves from retired", () => {
  const item = newRollingJourneyBaseline("code-208", "title-987");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
