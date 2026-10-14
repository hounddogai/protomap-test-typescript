import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPayoutSegment } from "./legacy-payout-segment.js";

test("LegacyPayoutSegment starts in proposed", () => {
  const item = newLegacyPayoutSegment("code-845", "name-525");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPayoutSegment moves to approved", () => {
  const item = newLegacyPayoutSegment("code-845", "name-525");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyPayoutSegment rejects moves from withdrawn", () => {
  const item = newLegacyPayoutSegment("code-845", "name-525");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
