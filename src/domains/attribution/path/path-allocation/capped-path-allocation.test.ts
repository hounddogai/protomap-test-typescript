import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPathAllocation } from "./capped-path-allocation.js";

test("CappedPathAllocation starts in open", () => {
  const item = newCappedPathAllocation("code-789", "name-715");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPathAllocation moves to in review", () => {
  const item = newCappedPathAllocation("code-789", "name-715");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedPathAllocation rejects moves from archived", () => {
  const item = newCappedPathAllocation("code-789", "name-715");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
