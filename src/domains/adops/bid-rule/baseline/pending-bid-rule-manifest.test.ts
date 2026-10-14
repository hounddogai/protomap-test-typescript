import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBidRuleManifest } from "./pending-bid-rule-manifest.js";

test("PendingBidRuleManifest starts in new", () => {
  const item = newPendingBidRuleManifest("code-4", "title-626");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBidRuleManifest moves to running", () => {
  const item = newPendingBidRuleManifest("code-4", "title-626");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PendingBidRuleManifest rejects moves from failed", () => {
  const item = newPendingBidRuleManifest("code-4", "title-626");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
