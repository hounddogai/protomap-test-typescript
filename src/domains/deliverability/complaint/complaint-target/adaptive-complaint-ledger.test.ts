import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveComplaintLedger } from "./adaptive-complaint-ledger.js";

test("AdaptiveComplaintLedger starts in proposed", () => {
  const item = newAdaptiveComplaintLedger("code-715", "title-780");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveComplaintLedger moves to approved", () => {
  const item = newAdaptiveComplaintLedger("code-715", "title-780");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveComplaintLedger rejects moves from withdrawn", () => {
  const item = newAdaptiveComplaintLedger("code-715", "title-780");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
