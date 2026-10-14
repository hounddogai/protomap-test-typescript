import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintCheckpointEngine } from "./complaint-checkpoint-engine.js";
import { newComplaintCheckpoint } from "./complaint-checkpoint.js";

test("ComplaintCheckpointEngine keeps results within bounds", () => {
  const engine = defaultComplaintCheckpointEngine(flags.newRegistry());
  const item = newComplaintCheckpoint("code-367", "name-943");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
