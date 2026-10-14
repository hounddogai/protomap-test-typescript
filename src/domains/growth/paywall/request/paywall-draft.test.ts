import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallDraft } from "./paywall-draft.js";

test("PaywallDraft starts in open", () => {
  const item = newPaywallDraft("code-603", "name-339");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallDraft moves to in review", () => {
  const item = newPaywallDraft("code-603", "name-339");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PaywallDraft rejects moves from archived", () => {
  const item = newPaywallDraft("code-603", "name-339");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
