import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInLedger } from "./double-opt-in-ledger.js";

test("DoubleOptInLedger starts in proposed", () => {
  const item = newDoubleOptInLedger("code-162", "title-617");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInLedger moves to withdrawn", () => {
  const item = newDoubleOptInLedger("code-162", "title-617");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DoubleOptInLedger rejects moves from withdrawn", () => {
  const item = newDoubleOptInLedger("code-162", "title-617");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
