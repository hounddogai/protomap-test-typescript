import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSubscriptionRecord } from "./capped-subscription-record.js";

test("CappedSubscriptionRecord starts in open", () => {
  const item = newCappedSubscriptionRecord("code-72", "title-134");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSubscriptionRecord moves to resolved", () => {
  const item = newCappedSubscriptionRecord("code-72", "title-134");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedSubscriptionRecord rejects moves from archived", () => {
  const item = newCappedSubscriptionRecord("code-72", "title-134");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
