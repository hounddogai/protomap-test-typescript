import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientPayoutScoreEngine } from "./lenient-payout-score-engine.js";
import { newLenientPayoutScore } from "./lenient-payout-score.js";

test("LenientPayoutScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientPayoutScoreEngine(flags.newRegistry());
  const item = newLenientPayoutScore("code-595", "label-467");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
