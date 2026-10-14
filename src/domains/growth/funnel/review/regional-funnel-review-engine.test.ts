import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalFunnelReviewEngine } from "./regional-funnel-review-engine.js";
import { newRegionalFunnelReview } from "./regional-funnel-review.js";

test("RegionalFunnelReviewEngine keeps results within bounds", () => {
  const engine = defaultRegionalFunnelReviewEngine(flags.newRegistry());
  const item = newRegionalFunnelReview("code-328", "title-897");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
