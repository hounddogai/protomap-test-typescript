import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalActivationTierEngine } from "./seasonal-activation-tier-engine.js";
import { newSeasonalActivationTier } from "./seasonal-activation-tier.js";

test("SeasonalActivationTierEngine keeps results within bounds", () => {
  const engine = defaultSeasonalActivationTierEngine(flags.newRegistry());
  const item = newSeasonalActivationTier("code-152", "name-151");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
