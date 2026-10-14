import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultWarmupEstimateEngine } from "./default-warmup-estimate-engine.js";
import { newDefaultWarmupEstimate } from "./default-warmup-estimate.js";

test("DefaultWarmupEstimateEngine keeps results within bounds", () => {
  const engine = defaultDefaultWarmupEstimateEngine();
  const item = newDefaultWarmupEstimate("code-97", "title-123");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
