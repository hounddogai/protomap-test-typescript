import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionLedger } from "./conversion-ledger.js";

test("ConversionLedger starts in proposed", () => {
  const item = newConversionLedger("code-53", "name-587");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionLedger moves to approved", () => {
  const item = newConversionLedger("code-53", "name-587");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ConversionLedger rejects moves from withdrawn", () => {
  const item = newConversionLedger("code-53", "name-587");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
