import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredSlaCheckpointEngine } from "./tiered-sla-checkpoint-engine.js";
import { newTieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

test("TieredSlaCheckpointEngine keeps results within bounds", () => {
  const engine = defaultTieredSlaCheckpointEngine();
  const item = newTieredSlaCheckpoint("code-211", "title-411");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
