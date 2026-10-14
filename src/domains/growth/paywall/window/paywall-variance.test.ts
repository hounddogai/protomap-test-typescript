import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallVariance } from "./paywall-variance.js";

test("PaywallVariance starts in draft", () => {
  const item = newPaywallVariance("code-754", "label-130");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallVariance moves to closed", () => {
  const item = newPaywallVariance("code-754", "label-130");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("PaywallVariance rejects moves from closed", () => {
  const item = newPaywallVariance("code-754", "label-130");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
