import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyLedger } from "./journey-ledger.js";

test("JourneyLedger starts in requested", () => {
  const item = newJourneyLedger("code-41", "title-356");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyLedger moves to revoked", () => {
  const item = newJourneyLedger("code-41", "title-356");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("JourneyLedger rejects moves from expired", () => {
  const item = newJourneyLedger("code-41", "title-356");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
