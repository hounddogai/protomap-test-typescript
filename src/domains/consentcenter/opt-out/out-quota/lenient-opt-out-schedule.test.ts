import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientOptOutSchedule } from "./lenient-opt-out-schedule.js";

test("LenientOptOutSchedule starts in proposed", () => {
  const item = newLenientOptOutSchedule("code-803", "name-539");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientOptOutSchedule moves to rejected", () => {
  const item = newLenientOptOutSchedule("code-803", "name-539");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LenientOptOutSchedule rejects moves from withdrawn", () => {
  const item = newLenientOptOutSchedule("code-803", "name-539");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
