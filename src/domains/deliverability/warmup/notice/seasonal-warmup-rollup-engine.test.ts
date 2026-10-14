import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalWarmupRollupEngine } from "./seasonal-warmup-rollup-engine.js";
import { newSeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

test("SeasonalWarmupRollupEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWarmupRollupEngine(flags.newRegistry());
  const item = newSeasonalWarmupRollup("code-407", "name-115");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
