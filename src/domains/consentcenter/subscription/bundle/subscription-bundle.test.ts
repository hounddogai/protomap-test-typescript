import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionBundle } from "./subscription-bundle.js";

test("SubscriptionBundle starts in created", () => {
  const item = newSubscriptionBundle("code-906", "label-465");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionBundle moves to published", () => {
  const item = newSubscriptionBundle("code-906", "label-465");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SubscriptionBundle rejects moves from retired", () => {
  const item = newSubscriptionBundle("code-906", "label-465");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
