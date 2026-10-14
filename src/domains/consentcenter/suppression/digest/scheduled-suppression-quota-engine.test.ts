import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledSuppressionQuotaEngine } from "./scheduled-suppression-quota-engine.js";
import { newScheduledSuppressionQuota } from "./scheduled-suppression-quota.js";

test("ScheduledSuppressionQuotaEngine keeps results within bounds", () => {
  const engine = defaultScheduledSuppressionQuotaEngine();
  const item = newScheduledSuppressionQuota("code-857", "title-269");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
