import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledTierScoreEngine } from "./scheduled-tier-score-engine.js";
import { newScheduledTierScore } from "./scheduled-tier-score.js";

test("ScheduledTierScoreEngine keeps results within bounds", () => {
  const engine = defaultScheduledTierScoreEngine(flags.newRegistry());
  const item = newScheduledTierScore("code-661", "label-557");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
