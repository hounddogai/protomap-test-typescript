import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelScoreEngine } from "./funnel-score-engine.js";
import { newFunnelScore } from "./funnel-score.js";

test("FunnelScoreEngine keeps results within bounds", () => {
  const engine = defaultFunnelScoreEngine();
  const item = newFunnelScore("code-248", "label-266");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
