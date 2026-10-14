import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackFunnelBatchEngine } from "./fallback-funnel-batch-engine.js";
import { newFallbackFunnelBatch } from "./fallback-funnel-batch.js";

test("FallbackFunnelBatchEngine keeps results within bounds", () => {
  const engine = defaultFallbackFunnelBatchEngine();
  const item = newFallbackFunnelBatch("code-490", "name-356");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
