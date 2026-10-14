import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionLedger } from "./deflection-ledger.js";

test("DeflectionLedger starts in proposed", () => {
  const item = newDeflectionLedger("code-361", "name-709");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionLedger moves to rejected", () => {
  const item = newDeflectionLedger("code-361", "name-709");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("DeflectionLedger rejects moves from withdrawn", () => {
  const item = newDeflectionLedger("code-361", "name-709");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
