import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingFlightCheckpointEngine } from "./pending-flight-checkpoint-engine.js";
import { newPendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

test("PendingFlightCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPendingFlightCheckpointEngine(flags.newRegistry());
  const item = newPendingFlightCheckpoint("code-209", "title-464");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
