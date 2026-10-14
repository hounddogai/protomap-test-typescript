import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

test("PrimaryPaywallCycle starts in draft", () => {
  const item = newPrimaryPaywallCycle("code-481", "label-699");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPaywallCycle moves to pending", () => {
  const item = newPrimaryPaywallCycle("code-481", "label-699");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryPaywallCycle rejects moves from closed", () => {
  const item = newPrimaryPaywallCycle("code-481", "label-699");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
