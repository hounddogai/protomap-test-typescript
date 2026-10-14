import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalSlaVarianceEngine } from "./seasonal-sla-variance-engine.js";
import { newSeasonalSlaVariance } from "./seasonal-sla-variance.js";

test("SeasonalSlaVarianceEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSlaVarianceEngine(flags.newRegistry());
  const item = newSeasonalSlaVariance("code-942", "name-7");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
