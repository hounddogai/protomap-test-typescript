import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyConversionMetric } from "./legacy-conversion-metric.js";

test("LegacyConversionMetric starts in proposed", () => {
  const item = newLegacyConversionMetric("code-298", "title-182");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyConversionMetric moves to approved", () => {
  const item = newLegacyConversionMetric("code-298", "title-182");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyConversionMetric rejects moves from withdrawn", () => {
  const item = newLegacyConversionMetric("code-298", "title-182");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
