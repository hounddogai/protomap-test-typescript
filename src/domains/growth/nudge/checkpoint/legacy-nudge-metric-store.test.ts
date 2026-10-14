import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyNudgeMetricStore } from "./legacy-nudge-metric-store.js";
import { newLegacyNudgeMetric } from "./legacy-nudge-metric.js";

test("MemoryLegacyNudgeMetricStore finds what it saved", () => {
  const store = newMemoryLegacyNudgeMetricStore();
  const item = newLegacyNudgeMetric("code-724", "title-41");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
