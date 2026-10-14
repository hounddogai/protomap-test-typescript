import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredRetentionScoreEngine } from "./tiered-retention-score-engine.js";
import { newTieredRetentionScore } from "./tiered-retention-score.js";

test("TieredRetentionScoreEngine keeps results within bounds", () => {
  const engine = defaultTieredRetentionScoreEngine(flags.newRegistry());
  const item = newTieredRetentionScore("code-110", "label-819");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
