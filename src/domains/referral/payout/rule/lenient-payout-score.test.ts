import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPayoutScore } from "./lenient-payout-score.js";

test("LenientPayoutScore starts in proposed", () => {
  const item = newLenientPayoutScore("code-595", "label-467");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPayoutScore moves to rejected", () => {
  const item = newLenientPayoutScore("code-595", "label-467");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LenientPayoutScore rejects moves from withdrawn", () => {
  const item = newLenientPayoutScore("code-595", "label-467");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
