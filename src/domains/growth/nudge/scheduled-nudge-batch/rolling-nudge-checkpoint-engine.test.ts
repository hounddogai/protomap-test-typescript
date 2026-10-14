import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingNudgeCheckpointEngine } from "./rolling-nudge-checkpoint-engine.js";
import { newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

test("RollingNudgeCheckpointEngine keeps results within bounds", () => {
  const engine = defaultRollingNudgeCheckpointEngine(flags.newRegistry());
  const item = newRollingNudgeCheckpoint("code-813", "name-830");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
