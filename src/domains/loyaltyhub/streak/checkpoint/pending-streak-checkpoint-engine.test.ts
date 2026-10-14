import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingStreakCheckpointEngine } from "./pending-streak-checkpoint-engine.js";
import { newPendingStreakCheckpoint } from "./pending-streak-checkpoint.js";

test("PendingStreakCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPendingStreakCheckpointEngine();
  const item = newPendingStreakCheckpoint("code-658", "label-231");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
