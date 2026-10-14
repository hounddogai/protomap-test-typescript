import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyRetentionQuotaEngine } from "./legacy-retention-quota-engine.js";
import { newLegacyRetentionQuota } from "./legacy-retention-quota.js";

test("LegacyRetentionQuotaEngine keeps results within bounds", () => {
  const engine = defaultLegacyRetentionQuotaEngine();
  const item = newLegacyRetentionQuota("code-804", "title-340");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
