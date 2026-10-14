import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightTierEngine } from "./insight-tier-engine.js";
import { newInsightTier } from "./insight-tier.js";

test("InsightTierEngine keeps results within bounds", () => {
  const engine = defaultInsightTierEngine(flags.newRegistry());
  const item = newInsightTier("code-12", "title-790");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
