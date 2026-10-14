import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFlightGroup } from "./capped-flight-group.js";

test("CappedFlightGroup starts in proposed", () => {
  const item = newCappedFlightGroup("code-377", "title-818");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFlightGroup moves to approved", () => {
  const item = newCappedFlightGroup("code-377", "title-818");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedFlightGroup rejects moves from withdrawn", () => {
  const item = newCappedFlightGroup("code-377", "title-818");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
