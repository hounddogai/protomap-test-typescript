import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredReplyVarianceEngine } from "./tiered-reply-variance-engine.js";
import { newTieredReplyVariance } from "./tiered-reply-variance.js";

test("TieredReplyVarianceEngine keeps results within bounds", () => {
  const engine = defaultTieredReplyVarianceEngine(flags.newRegistry());
  const item = newTieredReplyVariance("code-982", "title-94");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
