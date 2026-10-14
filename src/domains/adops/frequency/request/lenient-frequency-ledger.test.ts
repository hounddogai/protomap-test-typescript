import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFrequencyLedger } from "./lenient-frequency-ledger.js";

test("LenientFrequencyLedger starts in proposed", () => {
  const item = newLenientFrequencyLedger("code-24", "name-314");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFrequencyLedger moves to approved", () => {
  const item = newLenientFrequencyLedger("code-24", "name-314");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientFrequencyLedger rejects moves from withdrawn", () => {
  const item = newLenientFrequencyLedger("code-24", "name-314");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
