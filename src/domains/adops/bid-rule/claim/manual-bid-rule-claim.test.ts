import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleClaim } from "./manual-bid-rule-claim.js";

test("ManualBidRuleClaim starts in idle", () => {
  const item = newManualBidRuleClaim("code-755", "label-906");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleClaim moves to ready", () => {
  const item = newManualBidRuleClaim("code-755", "label-906");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualBidRuleClaim rejects moves from stopped", () => {
  const item = newManualBidRuleClaim("code-755", "label-906");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
