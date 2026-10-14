import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualChallengeSummaryEngine } from "./manual-challenge-summary-engine.js";
import { newManualChallengeSummary } from "./manual-challenge-summary.js";

test("ManualChallengeSummaryEngine keeps results within bounds", () => {
  const engine = defaultManualChallengeSummaryEngine();
  const item = newManualChallengeSummary("code-766", "name-329");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
