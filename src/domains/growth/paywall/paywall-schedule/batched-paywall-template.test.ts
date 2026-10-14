import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPaywallTemplate } from "./batched-paywall-template.js";

test("BatchedPaywallTemplate starts in created", () => {
  const item = newBatchedPaywallTemplate("code-347", "title-89");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPaywallTemplate moves to published", () => {
  const item = newBatchedPaywallTemplate("code-347", "title-89");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedPaywallTemplate rejects moves from retired", () => {
  const item = newBatchedPaywallTemplate("code-347", "title-89");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
