import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFlightException } from "./lenient-flight-exception.js";

test("LenientFlightException starts in planned", () => {
  const item = newLenientFlightException("code-78", "title-89");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFlightException moves to scheduled", () => {
  const item = newLenientFlightException("code-78", "title-89");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientFlightException rejects moves from cancelled", () => {
  const item = newLenientFlightException("code-78", "title-89");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
