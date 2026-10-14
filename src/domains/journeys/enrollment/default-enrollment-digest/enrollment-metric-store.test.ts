import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentMetricStore } from "./enrollment-metric-store.js";
import { newEnrollmentMetric } from "./enrollment-metric.js";

test("MemoryEnrollmentMetricStore finds what it saved", () => {
  const store = newMemoryEnrollmentMetricStore();
  const item = newEnrollmentMetric("code-455", "name-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
