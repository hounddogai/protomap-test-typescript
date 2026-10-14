import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRetentionTier } from "./fallback-retention-tier.js";

test("FallbackRetentionTier starts in proposed", () => {
  const item = newFallbackRetentionTier("code-261", "title-632");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRetentionTier moves to rejected", () => {
  const item = newFallbackRetentionTier("code-261", "title-632");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackRetentionTier rejects moves from withdrawn", () => {
  const item = newFallbackRetentionTier("code-261", "title-632");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
