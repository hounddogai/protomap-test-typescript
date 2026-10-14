import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutTemplate } from "./payout-template.js";

test("PayoutTemplate starts in proposed", () => {
  const item = newPayoutTemplate("code-247", "label-703");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutTemplate moves to approved", () => {
  const item = newPayoutTemplate("code-247", "label-703");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PayoutTemplate rejects moves from withdrawn", () => {
  const item = newPayoutTemplate("code-247", "label-703");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
