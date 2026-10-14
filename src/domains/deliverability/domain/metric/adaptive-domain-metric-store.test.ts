import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDomainMetricStore } from "./adaptive-domain-metric-store.js";
import { newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

test("MemoryAdaptiveDomainMetricStore finds what it saved", () => {
  const store = newMemoryAdaptiveDomainMetricStore();
  const item = newAdaptiveDomainMetric("code-144", "name-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
