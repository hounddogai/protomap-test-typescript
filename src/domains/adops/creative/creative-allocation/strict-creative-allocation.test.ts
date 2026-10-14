import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictCreativeAllocation } from "./strict-creative-allocation.js";

test("StrictCreativeAllocation starts in new", () => {
  const item = newStrictCreativeAllocation("code-639", "title-767");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictCreativeAllocation moves to queued", () => {
  const item = newStrictCreativeAllocation("code-639", "title-767");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictCreativeAllocation rejects moves from failed", () => {
  const item = newStrictCreativeAllocation("code-639", "title-767");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
