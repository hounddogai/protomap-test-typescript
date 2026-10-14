import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredChallengeSummaryEngine } from "./tiered-challenge-summary-engine.js";
import { newTieredChallengeSummary } from "./tiered-challenge-summary.js";

test("TieredChallengeSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredChallengeSummaryEngine();
  const item = newTieredChallengeSummary("code-762", "label-577");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
