import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedPlacementRollupEngine } from "./batched-placement-rollup-engine.js";
import { newBatchedPlacementRollup } from "./batched-placement-rollup.js";

test("BatchedPlacementRollupEngine keeps results within bounds", () => {
  const engine = defaultBatchedPlacementRollupEngine();
  const item = newBatchedPlacementRollup("code-269", "name-283");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
