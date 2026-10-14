import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallEntry } from "./paywall-entry.js";

test("PaywallEntry starts in draft", () => {
  const item = newPaywallEntry("code-838", "name-593");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallEntry moves to pending", () => {
  const item = newPaywallEntry("code-838", "name-593");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PaywallEntry rejects moves from closed", () => {
  const item = newPaywallEntry("code-838", "name-593");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
