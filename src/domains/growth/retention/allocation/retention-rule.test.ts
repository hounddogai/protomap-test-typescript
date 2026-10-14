import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionRule } from "./retention-rule.js";

test("RetentionRule starts in planned", () => {
  const item = newRetentionRule("code-868", "name-228");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionRule moves to completed", () => {
  const item = newRetentionRule("code-868", "name-228");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RetentionRule rejects moves from cancelled", () => {
  const item = newRetentionRule("code-868", "name-228");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
