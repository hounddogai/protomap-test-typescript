import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedStreakExceptionEngine } from "./batched-streak-exception-engine.js";
import { newBatchedStreakException } from "./batched-streak-exception.js";

test("BatchedStreakExceptionEngine keeps results within bounds", () => {
  const engine = defaultBatchedStreakExceptionEngine(flags.newRegistry());
  const item = newBatchedStreakException("code-142", "label-19");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
