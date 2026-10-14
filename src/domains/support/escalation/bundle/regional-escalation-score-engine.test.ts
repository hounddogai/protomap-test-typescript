import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalEscalationScoreEngine } from "./regional-escalation-score-engine.js";
import { newRegionalEscalationScore } from "./regional-escalation-score.js";

test("RegionalEscalationScoreEngine keeps results within bounds", () => {
  const engine = defaultRegionalEscalationScoreEngine();
  const item = newRegionalEscalationScore("code-291", "title-225");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
