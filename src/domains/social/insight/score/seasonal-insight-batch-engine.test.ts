import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalInsightBatchEngine } from "./seasonal-insight-batch-engine.js";
import { newSeasonalInsightBatch } from "./seasonal-insight-batch.js";

test("SeasonalInsightBatchEngine keeps results within bounds", () => {
  const engine = defaultSeasonalInsightBatchEngine(flags.newRegistry());
  const item = newSeasonalInsightBatch("code-313", "name-180");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
