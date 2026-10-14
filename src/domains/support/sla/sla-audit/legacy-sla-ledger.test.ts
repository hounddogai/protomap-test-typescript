import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacySlaLedger } from "./legacy-sla-ledger.js";

test("LegacySlaLedger starts in proposed", () => {
  const item = newLegacySlaLedger("code-789", "name-547");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacySlaLedger moves to approved", () => {
  const item = newLegacySlaLedger("code-789", "name-547");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacySlaLedger rejects moves from withdrawn", () => {
  const item = newLegacySlaLedger("code-789", "name-547");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
