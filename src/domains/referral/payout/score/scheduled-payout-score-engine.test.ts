import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledPayoutScoreEngine } from "./scheduled-payout-score-engine.js";
import { newScheduledPayoutScore } from "./scheduled-payout-score.js";

test("ScheduledPayoutScoreEngine keeps results within bounds", () => {
  const engine = defaultScheduledPayoutScoreEngine();
  const item = newScheduledPayoutScore("code-812", "name-491");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
