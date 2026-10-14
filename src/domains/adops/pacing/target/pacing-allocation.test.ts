import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingAllocation } from "./pacing-allocation.js";

test("PacingAllocation starts in created", () => {
  const item = newPacingAllocation("code-629", "name-621");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingAllocation moves to validated", () => {
  const item = newPacingAllocation("code-629", "name-621");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PacingAllocation rejects moves from retired", () => {
  const item = newPacingAllocation("code-629", "name-621");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
