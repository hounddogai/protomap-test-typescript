import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingOptOutAgreement } from "./rolling-opt-out-agreement.js";

test("RollingOptOutAgreement starts in proposed", () => {
  const item = newRollingOptOutAgreement("code-514", "label-148");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingOptOutAgreement moves to rejected", () => {
  const item = newRollingOptOutAgreement("code-514", "label-148");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingOptOutAgreement rejects moves from withdrawn", () => {
  const item = newRollingOptOutAgreement("code-514", "label-148");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
