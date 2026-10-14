import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEscalationMetricStore } from "./seasonal-escalation-metric-store.js";
import { newSeasonalEscalationMetric } from "./seasonal-escalation-metric.js";

test("MemorySeasonalEscalationMetricStore finds what it saved", () => {
  const store = newMemorySeasonalEscalationMetricStore();
  const item = newSeasonalEscalationMetric("code-156", "label-848");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
