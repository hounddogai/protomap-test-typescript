import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierCheckpointEngine } from "./tier-checkpoint-engine.js";
import { newTierCheckpoint } from "./tier-checkpoint.js";

test("TierCheckpointEngine keeps results within bounds", () => {
  const engine = defaultTierCheckpointEngine();
  const item = newTierCheckpoint("code-511", "name-389");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
