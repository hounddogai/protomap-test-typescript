import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionEstimate } from "./subscription-estimate.js";

test("SubscriptionEstimate starts in draft", () => {
  const item = newSubscriptionEstimate("code-560", "name-164");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionEstimate moves to pending", () => {
  const item = newSubscriptionEstimate("code-560", "name-164");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SubscriptionEstimate rejects moves from closed", () => {
  const item = newSubscriptionEstimate("code-560", "name-164");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
