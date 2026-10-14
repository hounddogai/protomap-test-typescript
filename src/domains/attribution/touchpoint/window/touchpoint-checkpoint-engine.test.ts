import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointCheckpointEngine } from "./touchpoint-checkpoint-engine.js";
import { newTouchpointCheckpoint } from "./touchpoint-checkpoint.js";

test("TouchpointCheckpointEngine keeps results within bounds", () => {
  const engine = defaultTouchpointCheckpointEngine();
  const item = newTouchpointCheckpoint("code-852", "label-243");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
