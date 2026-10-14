import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleBudget } from "./manual-bid-rule-budget.js";

test("ManualBidRuleBudget starts in proposed", () => {
  const item = newManualBidRuleBudget("code-457", "title-736");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleBudget moves to withdrawn", () => {
  const item = newManualBidRuleBudget("code-457", "title-736");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ManualBidRuleBudget rejects moves from withdrawn", () => {
  const item = newManualBidRuleBudget("code-457", "title-736");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
