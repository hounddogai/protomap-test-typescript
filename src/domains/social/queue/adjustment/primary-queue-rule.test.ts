import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryQueueRule } from "./primary-queue-rule.js";

test("PrimaryQueueRule starts in requested", () => {
  const item = newPrimaryQueueRule("code-67", "name-780");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryQueueRule moves to expired", () => {
  const item = newPrimaryQueueRule("code-67", "name-780");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("PrimaryQueueRule rejects moves from expired", () => {
  const item = newPrimaryQueueRule("code-67", "name-780");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
