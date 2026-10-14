import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionAllocation } from "./deflection-allocation.js";

test("DeflectionAllocation starts in planned", () => {
  const item = newDeflectionAllocation("code-6", "title-809");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionAllocation moves to cancelled", () => {
  const item = newDeflectionAllocation("code-6", "title-809");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("DeflectionAllocation rejects moves from cancelled", () => {
  const item = newDeflectionAllocation("code-6", "title-809");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
