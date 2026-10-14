import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierScoreEngine } from "./tier-score-engine.js";
import { newTierScore } from "./tier-score.js";

test("TierScoreEngine keeps results within bounds", () => {
  const engine = defaultTierScoreEngine(flags.newRegistry());
  const item = newTierScore("code-609", "name-902");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
