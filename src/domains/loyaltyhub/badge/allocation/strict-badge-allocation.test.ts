import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBadgeAllocation } from "./strict-badge-allocation.js";

test("StrictBadgeAllocation starts in new", () => {
  const item = newStrictBadgeAllocation("code-522", "title-804");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBadgeAllocation moves to queued", () => {
  const item = newStrictBadgeAllocation("code-522", "title-804");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictBadgeAllocation rejects moves from failed", () => {
  const item = newStrictBadgeAllocation("code-522", "title-804");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
