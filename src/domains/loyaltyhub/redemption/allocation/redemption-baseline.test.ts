import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionBaseline } from "./redemption-baseline.js";

test("RedemptionBaseline starts in idle", () => {
  const item = newRedemptionBaseline("code-358", "label-251");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionBaseline moves to draining", () => {
  const item = newRedemptionBaseline("code-358", "label-251");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RedemptionBaseline rejects moves from stopped", () => {
  const item = newRedemptionBaseline("code-358", "label-251");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
