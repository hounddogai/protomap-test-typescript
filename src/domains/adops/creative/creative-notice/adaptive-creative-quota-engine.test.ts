import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveCreativeQuotaEngine } from "./adaptive-creative-quota-engine.js";
import { newAdaptiveCreativeQuota } from "./adaptive-creative-quota.js";

test("AdaptiveCreativeQuotaEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCreativeQuotaEngine();
  const item = newAdaptiveCreativeQuota("code-254", "label-587");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
