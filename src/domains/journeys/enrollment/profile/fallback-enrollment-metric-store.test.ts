import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackEnrollmentMetricStore } from "./fallback-enrollment-metric-store.js";
import { newFallbackEnrollmentMetric } from "./fallback-enrollment-metric.js";

test("MemoryFallbackEnrollmentMetricStore finds what it saved", () => {
  const store = newMemoryFallbackEnrollmentMetricStore();
  const item = newFallbackEnrollmentMetric("code-317", "name-656");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
