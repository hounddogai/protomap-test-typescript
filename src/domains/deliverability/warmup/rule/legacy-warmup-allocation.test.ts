import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

test("LegacyWarmupAllocation starts in created", () => {
  const item = newLegacyWarmupAllocation("code-791", "name-120");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWarmupAllocation moves to validated", () => {
  const item = newLegacyWarmupAllocation("code-791", "name-120");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyWarmupAllocation rejects moves from retired", () => {
  const item = newLegacyWarmupAllocation("code-791", "name-120");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
