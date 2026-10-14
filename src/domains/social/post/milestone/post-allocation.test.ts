import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostAllocation } from "./post-allocation.js";

test("PostAllocation starts in planned", () => {
  const item = newPostAllocation("code-597", "label-794");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostAllocation moves to scheduled", () => {
  const item = newPostAllocation("code-597", "label-794");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PostAllocation rejects moves from cancelled", () => {
  const item = newPostAllocation("code-597", "label-794");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
