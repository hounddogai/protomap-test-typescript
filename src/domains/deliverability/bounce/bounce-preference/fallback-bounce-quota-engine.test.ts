import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackBounceQuotaEngine } from "./fallback-bounce-quota-engine.js";
import { newFallbackBounceQuota } from "./fallback-bounce-quota.js";

test("FallbackBounceQuotaEngine keeps results within bounds", () => {
  const engine = defaultFallbackBounceQuotaEngine();
  const item = newFallbackBounceQuota("code-702", "title-310");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
