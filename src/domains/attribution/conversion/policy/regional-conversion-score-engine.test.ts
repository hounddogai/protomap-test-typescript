import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalConversionScoreEngine } from "./regional-conversion-score-engine.js";
import { newRegionalConversionScore } from "./regional-conversion-score.js";

test("RegionalConversionScoreEngine keeps results within bounds", () => {
  const engine = defaultRegionalConversionScoreEngine(flags.newRegistry());
  const item = newRegionalConversionScore("code-681", "label-478");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
