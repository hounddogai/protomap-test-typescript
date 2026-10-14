import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFlightSlot } from "./lenient-flight-slot.js";

test("LenientFlightSlot starts in requested", () => {
  const item = newLenientFlightSlot("code-775", "title-643");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFlightSlot moves to revoked", () => {
  const item = newLenientFlightSlot("code-775", "title-643");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LenientFlightSlot rejects moves from expired", () => {
  const item = newLenientFlightSlot("code-775", "title-643");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
