import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryPlacementCheckpointEngine } from "./primary-placement-checkpoint-engine.js";
import { newPrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

test("PrimaryPlacementCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPlacementCheckpointEngine();
  const item = newPrimaryPlacementCheckpoint("code-443", "title-96");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
