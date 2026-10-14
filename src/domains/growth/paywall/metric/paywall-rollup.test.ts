import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallRollup } from "./paywall-rollup.js";

test("PaywallRollup starts in proposed", () => {
  const item = newPaywallRollup("code-352", "label-943");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallRollup moves to approved", () => {
  const item = newPaywallRollup("code-352", "label-943");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PaywallRollup rejects moves from withdrawn", () => {
  const item = newPaywallRollup("code-352", "label-943");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
