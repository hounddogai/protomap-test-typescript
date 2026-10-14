import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSubscriptionQuota } from "./fallback-subscription-quota.js";

test("FallbackSubscriptionQuota starts in created", () => {
  const item = newFallbackSubscriptionQuota("code-574", "title-878");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSubscriptionQuota moves to validated", () => {
  const item = newFallbackSubscriptionQuota("code-574", "title-878");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackSubscriptionQuota rejects moves from retired", () => {
  const item = newFallbackSubscriptionQuota("code-574", "title-878");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
