import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFlightException } from "./tiered-flight-exception.js";

test("TieredFlightException starts in new", () => {
  const item = newTieredFlightException("code-640", "title-527");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFlightException moves to queued", () => {
  const item = newTieredFlightException("code-640", "title-527");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredFlightException rejects moves from failed", () => {
  const item = newTieredFlightException("code-640", "title-527");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
