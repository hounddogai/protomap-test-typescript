import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelCheckpointEngine } from "./funnel-checkpoint-engine.js";
import { newFunnelCheckpoint } from "./funnel-checkpoint.js";

test("FunnelCheckpointEngine keeps results within bounds", () => {
  const engine = defaultFunnelCheckpointEngine(flags.newRegistry());
  const item = newFunnelCheckpoint("code-367", "label-64");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
