import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofMetricStore } from "./proof-metric-store.js";
import { newProofMetric } from "./proof-metric.js";

test("MemoryProofMetricStore finds what it saved", () => {
  const store = newMemoryProofMetricStore();
  const item = newProofMetric("code-409", "label-468");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
