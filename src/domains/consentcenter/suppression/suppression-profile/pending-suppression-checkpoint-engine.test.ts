import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingSuppressionCheckpointEngine } from "./pending-suppression-checkpoint-engine.js";
import { newPendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

test("PendingSuppressionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPendingSuppressionCheckpointEngine(flags.newRegistry());
  const item = newPendingSuppressionCheckpoint("code-385", "label-487");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
