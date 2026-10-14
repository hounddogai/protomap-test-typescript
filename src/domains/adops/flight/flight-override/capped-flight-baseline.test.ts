import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFlightBaseline } from "./capped-flight-baseline.js";

test("CappedFlightBaseline starts in draft", () => {
  const item = newCappedFlightBaseline("code-67", "title-589");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFlightBaseline moves to pending", () => {
  const item = newCappedFlightBaseline("code-67", "title-589");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CappedFlightBaseline rejects moves from closed", () => {
  const item = newCappedFlightBaseline("code-67", "title-589");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
