import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementBatchEngine } from "./placement-batch-engine.js";
import { newPlacementBatch } from "./placement-batch.js";

test("PlacementBatchEngine keeps results within bounds", () => {
  const engine = defaultPlacementBatchEngine(flags.newRegistry());
  const item = newPlacementBatch("code-171", "label-608");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
