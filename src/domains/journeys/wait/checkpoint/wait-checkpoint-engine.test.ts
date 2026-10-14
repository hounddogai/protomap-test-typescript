import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitCheckpointEngine } from "./wait-checkpoint-engine.js";
import { newWaitCheckpoint } from "./wait-checkpoint.js";

test("WaitCheckpointEngine keeps results within bounds", () => {
  const engine = defaultWaitCheckpointEngine(flags.newRegistry());
  const item = newWaitCheckpoint("code-348", "label-915");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
