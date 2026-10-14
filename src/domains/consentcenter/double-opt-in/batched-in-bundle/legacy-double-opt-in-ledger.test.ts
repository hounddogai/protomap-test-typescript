import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

test("LegacyDoubleOptInLedger starts in open", () => {
  const item = newLegacyDoubleOptInLedger("code-689", "title-674");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDoubleOptInLedger moves to reopened", () => {
  const item = newLegacyDoubleOptInLedger("code-689", "title-674");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("LegacyDoubleOptInLedger rejects moves from archived", () => {
  const item = newLegacyDoubleOptInLedger("code-689", "title-674");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
