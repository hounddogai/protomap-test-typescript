import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSlaLedger } from "./capped-sla-ledger.js";

test("CappedSlaLedger starts in planned", () => {
  const item = newCappedSlaLedger("code-934", "label-942");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSlaLedger moves to cancelled", () => {
  const item = newCappedSlaLedger("code-934", "label-942");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("CappedSlaLedger rejects moves from cancelled", () => {
  const item = newCappedSlaLedger("code-934", "label-942");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
