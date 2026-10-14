import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyStreakCheckpointEngine } from "./legacy-streak-checkpoint-engine.js";
import { newLegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

test("LegacyStreakCheckpointEngine keeps results within bounds", () => {
  const engine = defaultLegacyStreakCheckpointEngine(flags.newRegistry());
  const item = newLegacyStreakCheckpoint("code-112", "title-405");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
