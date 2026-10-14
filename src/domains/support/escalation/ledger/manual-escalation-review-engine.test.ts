import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualEscalationReviewEngine } from "./manual-escalation-review-engine.js";
import { newManualEscalationReview } from "./manual-escalation-review.js";

test("ManualEscalationReviewEngine keeps results within bounds", () => {
  const engine = defaultManualEscalationReviewEngine(flags.newRegistry());
  const item = newManualEscalationReview("code-688", "title-937");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
