import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveMacroCheckpointEngine } from "./adaptive-macro-checkpoint-engine.js";
import { newAdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

test("AdaptiveMacroCheckpointEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveMacroCheckpointEngine();
  const item = newAdaptiveMacroCheckpoint("code-151", "name-760");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
