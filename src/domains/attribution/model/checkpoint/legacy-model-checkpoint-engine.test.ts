import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyModelCheckpointEngine } from "./legacy-model-checkpoint-engine.js";
import { newLegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

test("LegacyModelCheckpointEngine keeps results within bounds", () => {
  const engine = defaultLegacyModelCheckpointEngine(flags.newRegistry());
  const item = newLegacyModelCheckpoint("code-719", "label-219");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
