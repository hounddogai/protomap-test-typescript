import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitLedger } from "./wait-ledger.js";

test("WaitLedger starts in proposed", () => {
  const item = newWaitLedger("code-82", "name-835");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitLedger moves to rejected", () => {
  const item = newWaitLedger("code-82", "name-835");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WaitLedger rejects moves from withdrawn", () => {
  const item = newWaitLedger("code-82", "name-835");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
