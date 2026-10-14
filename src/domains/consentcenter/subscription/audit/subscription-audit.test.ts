import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionAudit } from "./subscription-audit.js";

test("SubscriptionAudit starts in draft", () => {
  const item = newSubscriptionAudit("code-108", "label-701");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionAudit moves to pending", () => {
  const item = newSubscriptionAudit("code-108", "label-701");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SubscriptionAudit rejects moves from closed", () => {
  const item = newSubscriptionAudit("code-108", "label-701");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
