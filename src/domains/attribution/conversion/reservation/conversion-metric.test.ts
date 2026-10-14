import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionMetric } from "./conversion-metric.js";

test("ConversionMetric starts in created", () => {
  const item = newConversionMetric("code-761", "label-161");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionMetric moves to validated", () => {
  const item = newConversionMetric("code-761", "label-161");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ConversionMetric rejects moves from retired", () => {
  const item = newConversionMetric("code-761", "label-161");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
