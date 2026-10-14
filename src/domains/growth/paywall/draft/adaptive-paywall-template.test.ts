import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

test("AdaptivePaywallTemplate starts in created", () => {
  const item = newAdaptivePaywallTemplate("code-630", "name-444");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePaywallTemplate moves to validated", () => {
  const item = newAdaptivePaywallTemplate("code-630", "name-444");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptivePaywallTemplate rejects moves from retired", () => {
  const item = newAdaptivePaywallTemplate("code-630", "name-444");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
