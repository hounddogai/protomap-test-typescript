import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFlightSlot } from "./scheduled-flight-slot.js";

test("ScheduledFlightSlot starts in proposed", () => {
  const item = newScheduledFlightSlot("code-970", "name-904");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFlightSlot moves to rejected", () => {
  const item = newScheduledFlightSlot("code-970", "name-904");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ScheduledFlightSlot rejects moves from withdrawn", () => {
  const item = newScheduledFlightSlot("code-970", "name-904");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
