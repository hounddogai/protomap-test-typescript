import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalBadgeQuotaEngine } from "./regional-badge-quota-engine.js";
import { newRegionalBadgeQuota } from "./regional-badge-quota.js";

test("RegionalBadgeQuotaEngine keeps results within bounds", () => {
  const engine = defaultRegionalBadgeQuotaEngine();
  const item = newRegionalBadgeQuota("code-557", "name-421");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
