import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

test("ManualSubscriptionSnapshot starts in draft", () => {
  const item = newManualSubscriptionSnapshot("code-179", "title-223");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSubscriptionSnapshot moves to pending", () => {
  const item = newManualSubscriptionSnapshot("code-179", "title-223");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ManualSubscriptionSnapshot rejects moves from closed", () => {
  const item = newManualSubscriptionSnapshot("code-179", "title-223");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
