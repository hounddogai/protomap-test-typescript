import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintLedger } from "./complaint-ledger.js";

test("ComplaintLedger starts in proposed", () => {
  const item = newComplaintLedger("code-321", "title-685");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintLedger moves to rejected", () => {
  const item = newComplaintLedger("code-321", "title-685");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ComplaintLedger rejects moves from withdrawn", () => {
  const item = newComplaintLedger("code-321", "title-685");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
