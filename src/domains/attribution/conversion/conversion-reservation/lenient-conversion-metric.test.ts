import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientConversionMetric } from "./lenient-conversion-metric.js";

test("LenientConversionMetric starts in created", () => {
  const item = newLenientConversionMetric("code-521", "name-193");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientConversionMetric moves to retired", () => {
  const item = newLenientConversionMetric("code-521", "name-193");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("LenientConversionMetric rejects moves from retired", () => {
  const item = newLenientConversionMetric("code-521", "name-193");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
