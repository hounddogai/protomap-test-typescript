import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualPaywallVariance } from "./manual-paywall-variance.js";

test("ManualPaywallVariance starts in new", () => {
  const item = newManualPaywallVariance("code-601", "label-285");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualPaywallVariance moves to done", () => {
  const item = newManualPaywallVariance("code-601", "label-285");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ManualPaywallVariance rejects moves from failed", () => {
  const item = newManualPaywallVariance("code-601", "label-285");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
