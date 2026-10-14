import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementCheckpointEngine } from "./placement-checkpoint-engine.js";
import { newPlacementCheckpoint } from "./placement-checkpoint.js";

test("PlacementCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPlacementCheckpointEngine(flags.newRegistry());
  const item = newPlacementCheckpoint("code-257", "label-422");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
