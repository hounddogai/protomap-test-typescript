import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutScoreEngine } from "./payout-score-engine.js";
import { newPayoutScore } from "./payout-score.js";

test("PayoutScoreEngine keeps results within bounds", () => {
  const engine = defaultPayoutScoreEngine(flags.newRegistry());
  const item = newPayoutScore("code-114", "title-107");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
