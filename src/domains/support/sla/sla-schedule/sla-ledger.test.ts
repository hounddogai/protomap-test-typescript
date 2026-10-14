import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaLedger } from "./sla-ledger.js";

test("SlaLedger starts in proposed", () => {
  const item = newSlaLedger("code-851", "name-731");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaLedger moves to rejected", () => {
  const item = newSlaLedger("code-851", "name-731");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SlaLedger rejects moves from withdrawn", () => {
  const item = newSlaLedger("code-851", "name-731");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
