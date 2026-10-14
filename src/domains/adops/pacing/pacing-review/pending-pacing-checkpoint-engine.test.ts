import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingPacingCheckpointEngine } from "./pending-pacing-checkpoint-engine.js";
import { newPendingPacingCheckpoint } from "./pending-pacing-checkpoint.js";

test("PendingPacingCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPendingPacingCheckpointEngine(flags.newRegistry());
  const item = newPendingPacingCheckpoint("code-263", "name-326");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
