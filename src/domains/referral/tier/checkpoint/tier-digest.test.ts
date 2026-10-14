import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierDigest } from "./tier-digest.js";

test("TierDigest starts in proposed", () => {
  const item = newTierDigest("code-507", "label-893");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierDigest moves to approved", () => {
  const item = newTierDigest("code-507", "label-893");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TierDigest rejects moves from withdrawn", () => {
  const item = newTierDigest("code-507", "label-893");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
