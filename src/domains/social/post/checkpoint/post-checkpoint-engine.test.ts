import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostCheckpointEngine } from "./post-checkpoint-engine.js";
import { newPostCheckpoint } from "./post-checkpoint.js";

test("PostCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPostCheckpointEngine();
  const item = newPostCheckpoint("code-265", "label-371");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
