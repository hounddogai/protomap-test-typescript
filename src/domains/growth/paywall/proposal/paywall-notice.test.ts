import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallNotice } from "./paywall-notice.js";

test("PaywallNotice starts in draft", () => {
  const item = newPaywallNotice("code-608", "label-306");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallNotice moves to closed", () => {
  const item = newPaywallNotice("code-608", "label-306");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("PaywallNotice rejects moves from closed", () => {
  const item = newPaywallNotice("code-608", "label-306");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
