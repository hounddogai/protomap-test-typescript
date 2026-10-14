import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionRule } from "./subscription-rule.js";

test("SubscriptionRule starts in open", () => {
  const item = newSubscriptionRule("code-272", "name-541");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionRule moves to archived", () => {
  const item = newSubscriptionRule("code-272", "name-541");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("SubscriptionRule rejects moves from archived", () => {
  const item = newSubscriptionRule("code-272", "name-541");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
