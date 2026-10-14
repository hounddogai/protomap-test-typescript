import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

test("PrimaryPaywallBaseline starts in draft", () => {
  const item = newPrimaryPaywallBaseline("code-713", "title-117");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPaywallBaseline moves to pending", () => {
  const item = newPrimaryPaywallBaseline("code-713", "title-117");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryPaywallBaseline rejects moves from closed", () => {
  const item = newPrimaryPaywallBaseline("code-713", "title-117");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
