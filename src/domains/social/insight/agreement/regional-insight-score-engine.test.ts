import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalInsightScoreEngine } from "./regional-insight-score-engine.js";
import { newRegionalInsightScore } from "./regional-insight-score.js";

test("RegionalInsightScoreEngine keeps results within bounds", () => {
  const engine = defaultRegionalInsightScoreEngine(flags.newRegistry());
  const item = newRegionalInsightScore("code-84", "label-469");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
