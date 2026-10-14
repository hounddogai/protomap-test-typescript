import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDomainMetricStore } from "./scheduled-domain-metric-store.js";
import { newScheduledDomainMetric } from "./scheduled-domain-metric.js";

test("MemoryScheduledDomainMetricStore finds what it saved", () => {
  const store = newMemoryScheduledDomainMetricStore();
  const item = newScheduledDomainMetric("code-116", "label-298");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
