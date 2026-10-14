import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredSuppressionCheckpointEngine } from "./tiered-suppression-checkpoint-engine.js";
import { newTieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

test("TieredSuppressionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultTieredSuppressionCheckpointEngine(flags.newRegistry());
  const item = newTieredSuppressionCheckpoint("code-546", "name-204");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
