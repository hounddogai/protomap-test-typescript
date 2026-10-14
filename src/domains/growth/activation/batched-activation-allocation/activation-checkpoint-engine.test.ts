import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationCheckpointEngine } from "./activation-checkpoint-engine.js";
import { newActivationCheckpoint } from "./activation-checkpoint.js";

test("ActivationCheckpointEngine keeps results within bounds", () => {
  const engine = defaultActivationCheckpointEngine(flags.newRegistry());
  const item = newActivationCheckpoint("code-392", "label-888");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
