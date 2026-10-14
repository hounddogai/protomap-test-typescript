import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPayoutBundle } from "./legacy-payout-bundle.js";

test("LegacyPayoutBundle starts in planned", () => {
  const item = newLegacyPayoutBundle("code-904", "label-718");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPayoutBundle moves to scheduled", () => {
  const item = newLegacyPayoutBundle("code-904", "label-718");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LegacyPayoutBundle rejects moves from cancelled", () => {
  const item = newLegacyPayoutBundle("code-904", "label-718");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
