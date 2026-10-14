import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightDraft } from "./flight-draft.js";

test("FlightDraft starts in requested", () => {
  const item = newFlightDraft("code-591", "title-593");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightDraft moves to granted", () => {
  const item = newFlightDraft("code-591", "title-593");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FlightDraft rejects moves from expired", () => {
  const item = newFlightDraft("code-591", "title-593");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
