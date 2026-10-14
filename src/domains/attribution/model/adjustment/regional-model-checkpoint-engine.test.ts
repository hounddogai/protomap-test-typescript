import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalModelCheckpointEngine } from "./regional-model-checkpoint-engine.js";
import { newRegionalModelCheckpoint } from "./regional-model-checkpoint.js";

test("RegionalModelCheckpointEngine keeps results within bounds", () => {
  const engine = defaultRegionalModelCheckpointEngine(flags.newRegistry());
  const item = newRegionalModelCheckpoint("code-950", "title-416");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
