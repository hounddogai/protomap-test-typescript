import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

test("RollingBidRuleProfile starts in new", () => {
  const item = newRollingBidRuleProfile("code-27", "label-776");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingBidRuleProfile moves to queued", () => {
  const item = newRollingBidRuleProfile("code-27", "label-776");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingBidRuleProfile rejects moves from failed", () => {
  const item = newRollingBidRuleProfile("code-27", "label-776");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
