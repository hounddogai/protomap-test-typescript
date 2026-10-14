import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyQuotaEngine } from "./frequency-quota-engine.js";
import { newFrequencyQuota } from "./frequency-quota.js";

test("FrequencyQuotaEngine keeps results within bounds", () => {
  const engine = defaultFrequencyQuotaEngine();
  const item = newFrequencyQuota("code-36", "title-276");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
