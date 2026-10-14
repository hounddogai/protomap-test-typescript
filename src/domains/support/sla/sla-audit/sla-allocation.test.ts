import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaAllocation } from "./sla-allocation.js";

test("SlaAllocation starts in new", () => {
  const item = newSlaAllocation("code-715", "name-507");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaAllocation moves to running", () => {
  const item = newSlaAllocation("code-715", "name-507");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("SlaAllocation rejects moves from failed", () => {
  const item = newSlaAllocation("code-715", "name-507");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
