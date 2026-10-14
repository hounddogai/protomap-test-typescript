import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReputationVariance } from "./fallback-reputation-variance.js";

test("FallbackReputationVariance starts in open", () => {
  const item = newFallbackReputationVariance("code-193", "label-364");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReputationVariance moves to resolved", () => {
  const item = newFallbackReputationVariance("code-193", "label-364");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackReputationVariance rejects moves from archived", () => {
  const item = newFallbackReputationVariance("code-193", "label-364");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
