import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedMentionExceptionEngine } from "./weighted-mention-exception-engine.js";
import { newWeightedMentionException } from "./weighted-mention-exception.js";

test("WeightedMentionExceptionEngine keeps results within bounds", () => {
  const engine = defaultWeightedMentionExceptionEngine();
  const item = newWeightedMentionException("code-144", "label-926");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
