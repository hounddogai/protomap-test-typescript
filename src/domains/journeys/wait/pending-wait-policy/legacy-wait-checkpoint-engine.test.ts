import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyWaitCheckpointEngine } from "./legacy-wait-checkpoint-engine.js";
import { newLegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

test("LegacyWaitCheckpointEngine keeps results within bounds", () => {
  const engine = defaultLegacyWaitCheckpointEngine(flags.newRegistry());
  const item = newLegacyWaitCheckpoint("code-897", "title-833");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
