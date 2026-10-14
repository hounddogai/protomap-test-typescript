import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionTemplate } from "./subscription-template.js";

test("SubscriptionTemplate starts in created", () => {
  const item = newSubscriptionTemplate("code-241", "name-416");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionTemplate moves to published", () => {
  const item = newSubscriptionTemplate("code-241", "name-416");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SubscriptionTemplate rejects moves from retired", () => {
  const item = newSubscriptionTemplate("code-241", "name-416");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
