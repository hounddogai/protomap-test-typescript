import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledRetentionAllocation } from "./scheduled-retention-allocation.js";

test("ScheduledRetentionAllocation starts in open", () => {
  const item = newScheduledRetentionAllocation("code-498", "name-411");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledRetentionAllocation moves to in review", () => {
  const item = newScheduledRetentionAllocation("code-498", "name-411");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledRetentionAllocation rejects moves from archived", () => {
  const item = newScheduledRetentionAllocation("code-498", "name-411");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
