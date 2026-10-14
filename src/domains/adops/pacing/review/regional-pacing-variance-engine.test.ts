import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPacingVarianceEngine } from "./regional-pacing-variance-engine.js";
import { newRegionalPacingVariance } from "./regional-pacing-variance.js";

test("RegionalPacingVarianceEngine keeps results within bounds", () => {
  const engine = defaultRegionalPacingVarianceEngine(flags.newRegistry());
  const item = newRegionalPacingVariance("code-784", "title-842");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
