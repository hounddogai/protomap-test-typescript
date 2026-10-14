import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeCheckpointEngine } from "./nudge-checkpoint-engine.js";
import { newNudgeCheckpoint } from "./nudge-checkpoint.js";

test("NudgeCheckpointEngine keeps results within bounds", () => {
  const engine = defaultNudgeCheckpointEngine(flags.newRegistry());
  const item = newNudgeCheckpoint("code-734", "name-714");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
