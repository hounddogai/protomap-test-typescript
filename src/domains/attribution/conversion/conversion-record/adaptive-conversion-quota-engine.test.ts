import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveConversionQuotaEngine } from "./adaptive-conversion-quota-engine.js";
import { newAdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

test("AdaptiveConversionQuotaEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveConversionQuotaEngine();
  const item = newAdaptiveConversionQuota("code-962", "title-315");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
