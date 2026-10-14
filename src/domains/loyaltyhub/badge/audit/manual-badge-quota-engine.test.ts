import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualBadgeQuotaEngine } from "./manual-badge-quota-engine.js";
import { newManualBadgeQuota } from "./manual-badge-quota.js";

test("ManualBadgeQuotaEngine keeps results within bounds", () => {
  const engine = defaultManualBadgeQuotaEngine();
  const item = newManualBadgeQuota("code-470", "title-224");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
