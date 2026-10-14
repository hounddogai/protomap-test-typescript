import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionMapping } from "./subscription-mapping.js";

test("SubscriptionMapping starts in open", () => {
  const item = newSubscriptionMapping("code-993", "title-412");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionMapping moves to in review", () => {
  const item = newSubscriptionMapping("code-993", "title-412");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SubscriptionMapping rejects moves from archived", () => {
  const item = newSubscriptionMapping("code-993", "title-412");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
