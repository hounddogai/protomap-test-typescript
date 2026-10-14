import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionVarianceEngine } from "./mention-variance-engine.js";
import { newMentionVariance } from "./mention-variance.js";

test("MentionVarianceEngine keeps results within bounds", () => {
  const engine = defaultMentionVarianceEngine();
  const item = newMentionVariance("code-72", "label-42");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
