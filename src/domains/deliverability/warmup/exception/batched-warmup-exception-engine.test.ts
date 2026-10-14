import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedWarmupExceptionEngine } from "./batched-warmup-exception-engine.js";
import { newBatchedWarmupException } from "./batched-warmup-exception.js";

test("BatchedWarmupExceptionEngine keeps results within bounds", () => {
  const engine = defaultBatchedWarmupExceptionEngine(flags.newRegistry());
  const item = newBatchedWarmupException("code-115", "name-13");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
