import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationMetricStore } from "./escalation-metric-store.js";
import { newEscalationMetric } from "./escalation-metric.js";

test("MemoryEscalationMetricStore finds what it saved", () => {
  const store = newMemoryEscalationMetricStore();
  const item = newEscalationMetric("code-769", "label-324");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
