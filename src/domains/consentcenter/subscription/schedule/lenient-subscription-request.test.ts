import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSubscriptionRequest } from "./lenient-subscription-request.js";

test("LenientSubscriptionRequest starts in open", () => {
  const item = newLenientSubscriptionRequest("code-605", "name-8");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSubscriptionRequest moves to reopened", () => {
  const item = newLenientSubscriptionRequest("code-605", "name-8");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("LenientSubscriptionRequest rejects moves from archived", () => {
  const item = newLenientSubscriptionRequest("code-605", "name-8");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
