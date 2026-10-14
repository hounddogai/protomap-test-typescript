import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalCohortRollupEngine } from "./seasonal-cohort-rollup-engine.js";
import { newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

test("SeasonalCohortRollupEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCohortRollupEngine(flags.newRegistry());
  const item = newSeasonalCohortRollup("code-45", "name-497");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
