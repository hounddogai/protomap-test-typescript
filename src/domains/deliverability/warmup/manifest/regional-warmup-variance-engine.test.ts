import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalWarmupVarianceEngine } from "./regional-warmup-variance-engine.js";
import { newRegionalWarmupVariance } from "./regional-warmup-variance.js";

test("RegionalWarmupVarianceEngine keeps results within bounds", () => {
  const engine = defaultRegionalWarmupVarianceEngine(flags.newRegistry());
  const item = newRegionalWarmupVariance("code-962", "title-880");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
