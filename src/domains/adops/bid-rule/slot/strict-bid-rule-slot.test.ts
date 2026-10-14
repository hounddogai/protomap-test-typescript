import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBidRuleSlot } from "./strict-bid-rule-slot.js";

test("StrictBidRuleSlot starts in requested", () => {
  const item = newStrictBidRuleSlot("code-112", "title-882");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBidRuleSlot moves to revoked", () => {
  const item = newStrictBidRuleSlot("code-112", "title-882");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictBidRuleSlot rejects moves from expired", () => {
  const item = newStrictBidRuleSlot("code-112", "title-882");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
