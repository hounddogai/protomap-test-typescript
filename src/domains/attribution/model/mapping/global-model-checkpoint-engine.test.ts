import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalModelCheckpointEngine } from "./global-model-checkpoint-engine.js";
import { newGlobalModelCheckpoint } from "./global-model-checkpoint.js";

test("GlobalModelCheckpointEngine keeps results within bounds", () => {
  const engine = defaultGlobalModelCheckpointEngine(flags.newRegistry());
  const item = newGlobalModelCheckpoint("code-898", "name-146");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
