import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

test("RollingPaywallAgreement starts in created", () => {
  const item = newRollingPaywallAgreement("code-974", "label-668");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPaywallAgreement moves to validated", () => {
  const item = newRollingPaywallAgreement("code-974", "label-668");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RollingPaywallAgreement rejects moves from retired", () => {
  const item = newRollingPaywallAgreement("code-974", "label-668");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
