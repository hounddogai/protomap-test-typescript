import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

test("LenientBidRuleAdjustment starts in idle", () => {
  const item = newLenientBidRuleAdjustment("code-859", "title-471");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBidRuleAdjustment moves to ready", () => {
  const item = newLenientBidRuleAdjustment("code-859", "title-471");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientBidRuleAdjustment rejects moves from stopped", () => {
  const item = newLenientBidRuleAdjustment("code-859", "title-471");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
