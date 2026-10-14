import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFrequencyCycleEngine } from "./batched-frequency-cycle-engine.js";
import { newBatchedFrequencyCycle } from "./batched-frequency-cycle.js";

test("BatchedFrequencyCycleEngine keeps results within bounds", () => {
  const engine = defaultBatchedFrequencyCycleEngine(flags.newRegistry());
  const item = newBatchedFrequencyCycle("code-460", "label-928");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
