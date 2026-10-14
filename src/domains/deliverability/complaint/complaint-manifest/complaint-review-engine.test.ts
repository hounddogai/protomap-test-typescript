import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintReviewEngine } from "./complaint-review-engine.js";
import { newComplaintReview } from "./complaint-review.js";

test("ComplaintReviewEngine keeps results within bounds", () => {
  const engine = defaultComplaintReviewEngine(flags.newRegistry());
  const item = newComplaintReview("code-114", "label-334");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
