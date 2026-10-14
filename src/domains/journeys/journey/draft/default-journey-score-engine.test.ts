import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultJourneyScoreEngine } from "./default-journey-score-engine.js";
import { newDefaultJourneyScore } from "./default-journey-score.js";

test("DefaultJourneyScoreEngine keeps results within bounds", () => {
  const engine = defaultDefaultJourneyScoreEngine(flags.newRegistry());
  const item = newDefaultJourneyScore("code-138", "name-643");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
