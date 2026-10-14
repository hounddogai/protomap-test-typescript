import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredTicketViewReviewEngine } from "./tiered-ticket-view-review-engine.js";
import { newTieredTicketViewReview } from "./tiered-ticket-view-review.js";

test("TieredTicketViewReviewEngine keeps results within bounds", () => {
  const engine = defaultTieredTicketViewReviewEngine();
  const item = newTieredTicketViewReview("code-544", "label-719");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
