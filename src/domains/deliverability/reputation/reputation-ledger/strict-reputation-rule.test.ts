import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReputationRule } from "./strict-reputation-rule.js";

test("StrictReputationRule starts in open", () => {
  const item = newStrictReputationRule("code-887", "label-686");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReputationRule moves to in review", () => {
  const item = newStrictReputationRule("code-887", "label-686");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictReputationRule rejects moves from archived", () => {
  const item = newStrictReputationRule("code-887", "label-686");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
