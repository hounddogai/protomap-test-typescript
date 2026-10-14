import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallTemplate } from "./paywall-template.js";

test("PaywallTemplate starts in draft", () => {
  const item = newPaywallTemplate("code-438", "label-906");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallTemplate moves to pending", () => {
  const item = newPaywallTemplate("code-438", "label-906");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PaywallTemplate rejects moves from closed", () => {
  const item = newPaywallTemplate("code-438", "label-906");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
