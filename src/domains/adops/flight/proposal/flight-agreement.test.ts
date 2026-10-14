import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightAgreement } from "./flight-agreement.js";

test("FlightAgreement starts in created", () => {
  const item = newFlightAgreement("code-246", "label-686");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightAgreement moves to published", () => {
  const item = newFlightAgreement("code-246", "label-686");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FlightAgreement rejects moves from retired", () => {
  const item = newFlightAgreement("code-246", "label-686");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
