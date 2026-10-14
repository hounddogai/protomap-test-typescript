import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingJourneyRollupEngine } from "./rolling-journey-rollup-engine.js";
import { newRollingJourneyRollup } from "./rolling-journey-rollup.js";

test("RollingJourneyRollupEngine keeps results within bounds", () => {
  const engine = defaultRollingJourneyRollupEngine(flags.newRegistry());
  const item = newRollingJourneyRollup("code-567", "label-109");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
