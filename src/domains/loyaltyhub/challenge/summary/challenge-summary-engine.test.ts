import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeSummaryEngine } from "./challenge-summary-engine.js";
import { newChallengeSummary } from "./challenge-summary.js";

test("ChallengeSummaryEngine keeps results within bounds", () => {
  const engine = defaultChallengeSummaryEngine(flags.newRegistry());
  const item = newChallengeSummary("code-561", "title-959");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
