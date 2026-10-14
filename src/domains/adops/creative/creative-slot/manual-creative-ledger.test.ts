import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreativeLedger } from "./manual-creative-ledger.js";

test("ManualCreativeLedger starts in requested", () => {
  const item = newManualCreativeLedger("code-238", "title-16");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreativeLedger moves to expired", () => {
  const item = newManualCreativeLedger("code-238", "title-16");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ManualCreativeLedger rejects moves from expired", () => {
  const item = newManualCreativeLedger("code-238", "title-16");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
