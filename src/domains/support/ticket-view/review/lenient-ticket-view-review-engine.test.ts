import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientTicketViewReviewEngine } from "./lenient-ticket-view-review-engine.js";
import { newLenientTicketViewReview } from "./lenient-ticket-view-review.js";

test("LenientTicketViewReviewEngine keeps results within bounds", () => {
  const engine = defaultLenientTicketViewReviewEngine();
  const item = newLenientTicketViewReview("code-474", "name-910");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
