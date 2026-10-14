import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedConversionAudit } from "./weighted-conversion-audit.js";

test("WeightedConversionAudit starts in proposed", () => {
  const item = newWeightedConversionAudit("code-655", "name-136");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedConversionAudit moves to approved", () => {
  const item = newWeightedConversionAudit("code-655", "name-136");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedConversionAudit rejects moves from withdrawn", () => {
  const item = newWeightedConversionAudit("code-655", "name-136");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
