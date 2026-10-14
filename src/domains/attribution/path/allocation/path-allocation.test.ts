import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathAllocation } from "./path-allocation.js";

test("PathAllocation starts in proposed", () => {
  const item = newPathAllocation("code-493", "label-368");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathAllocation moves to approved", () => {
  const item = newPathAllocation("code-493", "label-368");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PathAllocation rejects moves from withdrawn", () => {
  const item = newPathAllocation("code-493", "label-368");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
