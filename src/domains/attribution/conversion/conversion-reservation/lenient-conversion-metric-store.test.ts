import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientConversionMetricStore } from "./lenient-conversion-metric-store.js";
import { newLenientConversionMetric } from "./lenient-conversion-metric.js";

test("MemoryLenientConversionMetricStore finds what it saved", () => {
  const store = newMemoryLenientConversionMetricStore();
  const item = newLenientConversionMetric("code-521", "name-193");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
