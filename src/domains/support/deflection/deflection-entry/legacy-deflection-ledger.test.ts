import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDeflectionLedger } from "./legacy-deflection-ledger.js";

test("LegacyDeflectionLedger starts in requested", () => {
  const item = newLegacyDeflectionLedger("code-989", "label-573");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDeflectionLedger moves to revoked", () => {
  const item = newLegacyDeflectionLedger("code-989", "label-573");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LegacyDeflectionLedger rejects moves from expired", () => {
  const item = newLegacyDeflectionLedger("code-989", "label-573");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
