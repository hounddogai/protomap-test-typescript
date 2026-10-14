import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakCheckpointEngine } from "./streak-checkpoint-engine.js";
import { newStreakCheckpoint } from "./streak-checkpoint.js";

test("StreakCheckpointEngine keeps results within bounds", () => {
  const engine = defaultStreakCheckpointEngine(flags.newRegistry());
  const item = newStreakCheckpoint("code-282", "title-733");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
