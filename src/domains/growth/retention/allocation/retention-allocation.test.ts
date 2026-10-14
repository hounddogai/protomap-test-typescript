import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionAllocation } from "./retention-allocation.js";

test("RetentionAllocation starts in planned", () => {
  const item = newRetentionAllocation("code-103", "label-888");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionAllocation moves to scheduled", () => {
  const item = newRetentionAllocation("code-103", "label-888");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RetentionAllocation rejects moves from cancelled", () => {
  const item = newRetentionAllocation("code-103", "label-888");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
