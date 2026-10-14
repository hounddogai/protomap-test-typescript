import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

test("CappedBidRuleCycle starts in created", () => {
  const item = newCappedBidRuleCycle("code-586", "name-650");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBidRuleCycle moves to published", () => {
  const item = newCappedBidRuleCycle("code-586", "name-650");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CappedBidRuleCycle rejects moves from retired", () => {
  const item = newCappedBidRuleCycle("code-586", "name-650");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
