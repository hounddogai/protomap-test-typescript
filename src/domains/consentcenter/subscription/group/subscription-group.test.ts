import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionGroup } from "./subscription-group.js";

test("SubscriptionGroup starts in open", () => {
  const item = newSubscriptionGroup("code-196", "title-471");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionGroup moves to in review", () => {
  const item = newSubscriptionGroup("code-196", "title-471");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SubscriptionGroup rejects moves from archived", () => {
  const item = newSubscriptionGroup("code-196", "title-471");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
