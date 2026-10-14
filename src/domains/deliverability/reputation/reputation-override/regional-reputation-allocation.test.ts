import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReputationAllocation } from "./regional-reputation-allocation.js";

test("RegionalReputationAllocation starts in draft", () => {
  const item = newRegionalReputationAllocation("code-848", "label-912");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReputationAllocation moves to closed", () => {
  const item = newRegionalReputationAllocation("code-848", "label-912");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("RegionalReputationAllocation rejects moves from closed", () => {
  const item = newRegionalReputationAllocation("code-848", "label-912");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
