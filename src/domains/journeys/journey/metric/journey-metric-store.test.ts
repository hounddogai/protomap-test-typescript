import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyMetricStore } from "./journey-metric-store.js";
import { newJourneyMetric } from "./journey-metric.js";

test("MemoryJourneyMetricStore finds what it saved", () => {
  const store = newMemoryJourneyMetricStore();
  const item = newJourneyMetric("code-166", "name-151");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
