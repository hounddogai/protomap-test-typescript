import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPathCycleEngine } from "./batched-path-cycle-engine.js";
import { newBatchedPathCycle } from "./batched-path-cycle.js";

test("BatchedPathCycleEngine keeps results within bounds", () => {
  const engine = defaultBatchedPathCycleEngine(flags.newRegistry());
  const item = newBatchedPathCycle("code-308", "label-204");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
