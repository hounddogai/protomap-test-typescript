import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleManifest } from "./bid-rule-manifest.js";

test("BidRuleManifest starts in idle", () => {
  const item = newBidRuleManifest("code-729", "label-906");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleManifest moves to warming", () => {
  const item = newBidRuleManifest("code-729", "label-906");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BidRuleManifest rejects moves from stopped", () => {
  const item = newBidRuleManifest("code-729", "label-906");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
