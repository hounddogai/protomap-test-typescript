import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictQueueScoreEngine } from "./strict-queue-score-engine.js";
import { newStrictQueueScore } from "./strict-queue-score.js";

test("StrictQueueScoreEngine keeps results within bounds", () => {
  const engine = defaultStrictQueueScoreEngine(flags.newRegistry());
  const item = newStrictQueueScore("code-21", "name-68");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
