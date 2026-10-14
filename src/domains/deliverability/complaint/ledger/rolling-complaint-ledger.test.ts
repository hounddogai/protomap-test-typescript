import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingComplaintLedger } from "./rolling-complaint-ledger.js";

test("RollingComplaintLedger starts in proposed", () => {
  const item = newRollingComplaintLedger("code-104", "label-205");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingComplaintLedger moves to rejected", () => {
  const item = newRollingComplaintLedger("code-104", "label-205");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingComplaintLedger rejects moves from withdrawn", () => {
  const item = newRollingComplaintLedger("code-104", "label-205");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
