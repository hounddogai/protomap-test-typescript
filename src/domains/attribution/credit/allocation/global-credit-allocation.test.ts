import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalCreditAllocation } from "./global-credit-allocation.js";

test("GlobalCreditAllocation starts in proposed", () => {
  const item = newGlobalCreditAllocation("code-658", "label-795");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalCreditAllocation moves to approved", () => {
  const item = newGlobalCreditAllocation("code-658", "label-795");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("GlobalCreditAllocation rejects moves from withdrawn", () => {
  const item = newGlobalCreditAllocation("code-658", "label-795");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
