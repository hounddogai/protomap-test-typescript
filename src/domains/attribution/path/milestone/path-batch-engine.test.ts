import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathBatchEngine } from "./path-batch-engine.js";
import { newPathBatch } from "./path-batch.js";

test("PathBatchEngine keeps results within bounds", () => {
  const engine = defaultPathBatchEngine(flags.newRegistry());
  const item = newPathBatch("code-990", "label-910");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
