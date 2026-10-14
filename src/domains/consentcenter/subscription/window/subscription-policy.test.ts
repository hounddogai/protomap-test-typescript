import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionPolicy } from "./subscription-policy.js";

test("SubscriptionPolicy starts in created", () => {
  const item = newSubscriptionPolicy("code-259", "label-263");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionPolicy moves to validated", () => {
  const item = newSubscriptionPolicy("code-259", "label-263");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SubscriptionPolicy rejects moves from retired", () => {
  const item = newSubscriptionPolicy("code-259", "label-263");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
