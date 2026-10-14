import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaCheckpointEngine } from "./sla-checkpoint-engine.js";
import { newSlaCheckpoint } from "./sla-checkpoint.js";

test("SlaCheckpointEngine keeps results within bounds", () => {
  const engine = defaultSlaCheckpointEngine();
  const item = newSlaCheckpoint("code-615", "label-477");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
