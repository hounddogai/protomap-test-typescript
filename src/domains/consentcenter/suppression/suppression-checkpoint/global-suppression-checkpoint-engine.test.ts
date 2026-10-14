import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalSuppressionCheckpointEngine } from "./global-suppression-checkpoint-engine.js";
import { newGlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

test("GlobalSuppressionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultGlobalSuppressionCheckpointEngine(flags.newRegistry());
  const item = newGlobalSuppressionCheckpoint("code-673", "title-277");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
