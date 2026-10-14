import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBidRuleWindow } from "./strict-bid-rule-window.js";

test("StrictBidRuleWindow starts in created", () => {
  const item = newStrictBidRuleWindow("code-945", "title-323");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBidRuleWindow moves to retired", () => {
  const item = newStrictBidRuleWindow("code-945", "title-323");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("StrictBidRuleWindow rejects moves from retired", () => {
  const item = newStrictBidRuleWindow("code-945", "title-323");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
