import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeMetricStore } from "./creative-metric-store.js";
import { newCreativeMetric } from "./creative-metric.js";

test("MemoryCreativeMetricStore finds what it saved", () => {
  const store = newMemoryCreativeMetricStore();
  const item = newCreativeMetric("code-911", "name-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
