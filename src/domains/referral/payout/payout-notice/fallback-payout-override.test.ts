import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPayoutOverride } from "./fallback-payout-override.js";

test("FallbackPayoutOverride starts in proposed", () => {
  const item = newFallbackPayoutOverride("code-142", "name-641");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPayoutOverride moves to approved", () => {
  const item = newFallbackPayoutOverride("code-142", "name-641");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackPayoutOverride rejects moves from withdrawn", () => {
  const item = newFallbackPayoutOverride("code-142", "name-641");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
