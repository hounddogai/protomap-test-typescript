import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySubscriptionRequest } from "./primary-subscription-request.js";

test("PrimarySubscriptionRequest starts in draft", () => {
  const item = newPrimarySubscriptionRequest("code-85", "name-910");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySubscriptionRequest moves to active", () => {
  const item = newPrimarySubscriptionRequest("code-85", "name-910");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimarySubscriptionRequest rejects moves from closed", () => {
  const item = newPrimarySubscriptionRequest("code-85", "name-910");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
