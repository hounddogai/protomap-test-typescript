import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionDigest } from "./redemption-digest.js";

test("RedemptionDigest starts in proposed", () => {
  const item = newRedemptionDigest("code-708", "label-229");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionDigest moves to withdrawn", () => {
  const item = newRedemptionDigest("code-708", "label-229");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RedemptionDigest rejects moves from withdrawn", () => {
  const item = newRedemptionDigest("code-708", "label-229");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
