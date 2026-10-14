import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictFlightCheckpointEngine } from "./strict-flight-checkpoint-engine.js";
import { newStrictFlightCheckpoint } from "./strict-flight-checkpoint.js";

test("StrictFlightCheckpointEngine keeps results within bounds", () => {
  const engine = defaultStrictFlightCheckpointEngine(flags.newRegistry());
  const item = newStrictFlightCheckpoint("code-710", "name-715");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
