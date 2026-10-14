import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPaywallScore } from "./capped-paywall-score.js";

test("CappedPaywallScore starts in draft", () => {
  const item = newCappedPaywallScore("code-183", "label-400");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPaywallScore moves to active", () => {
  const item = newCappedPaywallScore("code-183", "label-400");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CappedPaywallScore rejects moves from closed", () => {
  const item = newCappedPaywallScore("code-183", "label-400");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
