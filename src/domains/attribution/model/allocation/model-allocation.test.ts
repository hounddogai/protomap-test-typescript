import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelAllocation } from "./model-allocation.js";

test("ModelAllocation starts in proposed", () => {
  const item = newModelAllocation("code-95", "label-12");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelAllocation moves to rejected", () => {
  const item = newModelAllocation("code-95", "label-12");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ModelAllocation rejects moves from withdrawn", () => {
  const item = newModelAllocation("code-95", "label-12");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
