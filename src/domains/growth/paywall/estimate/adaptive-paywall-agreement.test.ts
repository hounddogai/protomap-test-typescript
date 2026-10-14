import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

test("AdaptivePaywallAgreement starts in open", () => {
  const item = newAdaptivePaywallAgreement("code-572", "title-330");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePaywallAgreement moves to reopened", () => {
  const item = newAdaptivePaywallAgreement("code-572", "title-330");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("AdaptivePaywallAgreement rejects moves from archived", () => {
  const item = newAdaptivePaywallAgreement("code-572", "title-330");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
