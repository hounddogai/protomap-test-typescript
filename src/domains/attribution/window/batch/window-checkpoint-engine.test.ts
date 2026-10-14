import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowCheckpointEngine } from "./window-checkpoint-engine.js";
import { newWindowCheckpoint } from "./window-checkpoint.js";

test("WindowCheckpointEngine keeps results within bounds", () => {
  const engine = defaultWindowCheckpointEngine(flags.newRegistry());
  const item = newWindowCheckpoint("code-795", "label-604");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
