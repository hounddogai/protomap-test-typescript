import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

test("LegacyFraudCheckRule starts in proposed", () => {
  const item = newLegacyFraudCheckRule("code-511", "title-556");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFraudCheckRule moves to rejected", () => {
  const item = newLegacyFraudCheckRule("code-511", "title-556");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LegacyFraudCheckRule rejects moves from withdrawn", () => {
  const item = newLegacyFraudCheckRule("code-511", "title-556");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
