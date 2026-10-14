import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFlightScore } from "./scheduled-flight-score.js";

test("ScheduledFlightScore starts in proposed", () => {
  const item = newScheduledFlightScore("code-543", "title-373");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFlightScore moves to approved", () => {
  const item = newScheduledFlightScore("code-543", "title-373");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledFlightScore rejects moves from withdrawn", () => {
  const item = newScheduledFlightScore("code-543", "title-373");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
