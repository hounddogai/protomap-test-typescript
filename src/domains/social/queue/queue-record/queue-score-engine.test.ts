import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueScoreEngine } from "./queue-score-engine.js";
import { newQueueScore } from "./queue-score.js";

test("QueueScoreEngine keeps results within bounds", () => {
  const engine = defaultQueueScoreEngine(flags.newRegistry());
  const item = newQueueScore("code-676", "name-457");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
