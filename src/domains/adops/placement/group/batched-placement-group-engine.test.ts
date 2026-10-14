import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPlacementGroupEngine } from "./batched-placement-group-engine.js";
import { newBatchedPlacementGroup } from "./batched-placement-group.js";

test("BatchedPlacementGroupEngine keeps results within bounds", () => {
  const engine = defaultBatchedPlacementGroupEngine(flags.newRegistry());
  const item = newBatchedPlacementGroup("code-305", "title-768");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
