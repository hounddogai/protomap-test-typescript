import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTouchpointBatchEngine } from "./touchpoint-batch-engine.js";
import { newTouchpointBatch } from "./touchpoint-batch.js";

test("TouchpointBatchEngine keeps results within bounds", () => {
  const engine = defaultTouchpointBatchEngine(flags.newRegistry());
  const item = newTouchpointBatch("code-105", "title-69");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
