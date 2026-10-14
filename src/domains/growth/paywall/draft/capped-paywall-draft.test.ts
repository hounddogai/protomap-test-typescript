import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPaywallDraft } from "./capped-paywall-draft.js";

test("CappedPaywallDraft starts in proposed", () => {
  const item = newCappedPaywallDraft("code-410", "title-783");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPaywallDraft moves to approved", () => {
  const item = newCappedPaywallDraft("code-410", "title-783");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CappedPaywallDraft rejects moves from withdrawn", () => {
  const item = newCappedPaywallDraft("code-410", "title-783");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
