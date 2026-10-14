import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFrequencyRollupEngine } from "./batched-frequency-rollup-engine.js";
import { newBatchedFrequencyRollup } from "./batched-frequency-rollup.js";

test("BatchedFrequencyRollupEngine keeps results within bounds", () => {
  const engine = defaultBatchedFrequencyRollupEngine(flags.newRegistry());
  const item = newBatchedFrequencyRollup("code-884", "label-590");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
