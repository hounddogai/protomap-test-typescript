import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleProfile } from "./manual-bid-rule-profile.js";

test("ManualBidRuleProfile starts in requested", () => {
  const item = newManualBidRuleProfile("code-467", "label-332");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleProfile moves to expired", () => {
  const item = newManualBidRuleProfile("code-467", "label-332");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ManualBidRuleProfile rejects moves from expired", () => {
  const item = newManualBidRuleProfile("code-467", "label-332");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
