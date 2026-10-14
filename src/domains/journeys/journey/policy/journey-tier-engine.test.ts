import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyTierEngine } from "./journey-tier-engine.js";
import { newJourneyTier } from "./journey-tier.js";

test("JourneyTierEngine keeps results within bounds", () => {
  const engine = defaultJourneyTierEngine(flags.newRegistry());
  const item = newJourneyTier("code-94", "name-140");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
