import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFlightLedger } from "./default-flight-ledger.js";

test("DefaultFlightLedger starts in planned", () => {
  const item = newDefaultFlightLedger("code-900", "label-50");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFlightLedger moves to completed", () => {
  const item = newDefaultFlightLedger("code-900", "label-50");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("DefaultFlightLedger rejects moves from cancelled", () => {
  const item = newDefaultFlightLedger("code-900", "label-50");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
