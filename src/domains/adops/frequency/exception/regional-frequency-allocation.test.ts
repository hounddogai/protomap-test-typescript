import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalFrequencyAllocation } from "./regional-frequency-allocation.js";

test("RegionalFrequencyAllocation starts in new", () => {
  const item = newRegionalFrequencyAllocation("code-575", "title-597");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalFrequencyAllocation moves to failed", () => {
  const item = newRegionalFrequencyAllocation("code-575", "title-597");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RegionalFrequencyAllocation rejects moves from failed", () => {
  const item = newRegionalFrequencyAllocation("code-575", "title-597");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
