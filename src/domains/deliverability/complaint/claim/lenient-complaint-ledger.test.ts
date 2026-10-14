import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientComplaintLedger } from "./lenient-complaint-ledger.js";

test("LenientComplaintLedger starts in draft", () => {
  const item = newLenientComplaintLedger("code-895", "name-21");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientComplaintLedger moves to suspended", () => {
  const item = newLenientComplaintLedger("code-895", "name-21");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LenientComplaintLedger rejects moves from closed", () => {
  const item = newLenientComplaintLedger("code-895", "name-21");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
