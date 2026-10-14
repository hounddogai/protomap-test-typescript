import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

test("PrimaryExitRuleTier starts in created", () => {
  const item = newPrimaryExitRuleTier("code-945", "title-466");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryExitRuleTier moves to validated", () => {
  const item = newPrimaryExitRuleTier("code-945", "title-466");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PrimaryExitRuleTier rejects moves from retired", () => {
  const item = newPrimaryExitRuleTier("code-945", "title-466");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
