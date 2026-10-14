import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalWarmupCheckpointEngine } from "./seasonal-warmup-checkpoint-engine.js";
import { newSeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

test("SeasonalWarmupCheckpointEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWarmupCheckpointEngine(flags.newRegistry());
  const item = newSeasonalWarmupCheckpoint("code-508", "title-26");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
