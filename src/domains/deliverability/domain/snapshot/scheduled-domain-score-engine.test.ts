import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledDomainScoreEngine } from "./scheduled-domain-score-engine.js";
import { newScheduledDomainScore } from "./scheduled-domain-score.js";

test("ScheduledDomainScoreEngine keeps results within bounds", () => {
  const engine = defaultScheduledDomainScoreEngine(flags.newRegistry());
  const item = newScheduledDomainScore("code-932", "label-519");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
