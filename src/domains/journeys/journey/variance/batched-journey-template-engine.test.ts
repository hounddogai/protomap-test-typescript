import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedJourneyTemplateEngine } from "./batched-journey-template-engine.js";
import { newBatchedJourneyTemplate } from "./batched-journey-template.js";

test("BatchedJourneyTemplateEngine keeps results within bounds", () => {
  const engine = defaultBatchedJourneyTemplateEngine(flags.newRegistry());
  const item = newBatchedJourneyTemplate("code-338", "title-425");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
