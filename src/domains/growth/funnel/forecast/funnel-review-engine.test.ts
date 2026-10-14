import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelReviewEngine } from "./funnel-review-engine.js";
import { newFunnelReview } from "./funnel-review.js";

test("FunnelReviewEngine keeps results within bounds", () => {
  const engine = defaultFunnelReviewEngine(flags.newRegistry());
  const item = newFunnelReview("code-62", "name-707");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
