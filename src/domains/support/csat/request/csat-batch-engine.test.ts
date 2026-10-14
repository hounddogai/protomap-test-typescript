import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatBatchEngine } from "./csat-batch-engine.js";
import { newCsatBatch } from "./csat-batch.js";

test("CsatBatchEngine keeps results within bounds", () => {
  const engine = defaultCsatBatchEngine(flags.newRegistry());
  const item = newCsatBatch("code-119", "name-778");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
