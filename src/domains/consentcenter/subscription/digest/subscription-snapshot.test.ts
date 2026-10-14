import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionSnapshot } from "./subscription-snapshot.js";

test("SubscriptionSnapshot starts in idle", () => {
  const item = newSubscriptionSnapshot("code-649", "name-803");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionSnapshot moves to stopped", () => {
  const item = newSubscriptionSnapshot("code-649", "name-803");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("SubscriptionSnapshot rejects moves from stopped", () => {
  const item = newSubscriptionSnapshot("code-649", "name-803");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
