import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingDomainMetricStore } from "./rolling-domain-metric-store.js";
import { newRollingDomainMetric } from "./rolling-domain-metric.js";

test("MemoryRollingDomainMetricStore finds what it saved", () => {
  const store = newMemoryRollingDomainMetricStore();
  const item = newRollingDomainMetric("code-97", "name-356");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
