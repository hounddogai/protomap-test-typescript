import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainMetricStore } from "./domain-metric-store.js";
import { newDomainMetric } from "./domain-metric.js";

test("MemoryDomainMetricStore finds what it saved", () => {
  const store = newMemoryDomainMetricStore();
  const item = newDomainMetric("code-137", "label-335");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
