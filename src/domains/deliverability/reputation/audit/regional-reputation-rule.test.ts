import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalReputationRule } from "./regional-reputation-rule.js";

test("RegionalReputationRule starts in created", () => {
  const item = newRegionalReputationRule("code-508", "label-385");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalReputationRule moves to validated", () => {
  const item = newRegionalReputationRule("code-508", "label-385");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalReputationRule rejects moves from retired", () => {
  const item = newRegionalReputationRule("code-508", "label-385");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
