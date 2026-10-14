import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPacingBatchEngine } from "./rolling-pacing-batch-engine.js";
import { newRollingPacingBatch } from "./rolling-pacing-batch.js";

test("RollingPacingBatchEngine keeps results within bounds", () => {
  const engine = defaultRollingPacingBatchEngine(flags.newRegistry());
  const item = newRollingPacingBatch("code-716", "name-67");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
