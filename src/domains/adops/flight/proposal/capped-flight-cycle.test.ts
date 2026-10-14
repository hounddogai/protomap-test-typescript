import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFlightCycle } from "./capped-flight-cycle.js";

test("CappedFlightCycle starts in draft", () => {
  const item = newCappedFlightCycle("code-382", "label-117");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFlightCycle moves to active", () => {
  const item = newCappedFlightCycle("code-382", "label-117");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CappedFlightCycle rejects moves from closed", () => {
  const item = newCappedFlightCycle("code-382", "label-117");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
