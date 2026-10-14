import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredModelDigest } from "./tiered-model-digest.js";

test("TieredModelDigest starts in proposed", () => {
  const item = newTieredModelDigest("code-162", "label-38");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredModelDigest moves to approved", () => {
  const item = newTieredModelDigest("code-162", "label-38");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredModelDigest rejects moves from withdrawn", () => {
  const item = newTieredModelDigest("code-162", "label-38");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
