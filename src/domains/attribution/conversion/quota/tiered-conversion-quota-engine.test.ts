import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredConversionQuotaEngine } from "./tiered-conversion-quota-engine.js";
import { newTieredConversionQuota } from "./tiered-conversion-quota.js";

test("TieredConversionQuotaEngine keeps results within bounds", () => {
  const engine = defaultTieredConversionQuotaEngine();
  const item = newTieredConversionQuota("code-169", "label-91");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
