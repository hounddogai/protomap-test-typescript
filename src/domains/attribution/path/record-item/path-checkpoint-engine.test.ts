import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPathCheckpointEngine } from "./path-checkpoint-engine.js";
import { newPathCheckpoint } from "./path-checkpoint.js";

test("PathCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPathCheckpointEngine();
  const item = newPathCheckpoint("code-907", "name-31");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
