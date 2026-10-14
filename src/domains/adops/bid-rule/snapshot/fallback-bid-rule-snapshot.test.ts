import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBidRuleSnapshot } from "./fallback-bid-rule-snapshot.js";

test("FallbackBidRuleSnapshot starts in requested", () => {
  const item = newFallbackBidRuleSnapshot("code-978", "name-32");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBidRuleSnapshot moves to revoked", () => {
  const item = newFallbackBidRuleSnapshot("code-978", "name-32");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("FallbackBidRuleSnapshot rejects moves from expired", () => {
  const item = newFallbackBidRuleSnapshot("code-978", "name-32");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
