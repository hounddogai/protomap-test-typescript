import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredTouchpointCheckpointEngine } from "./tiered-touchpoint-checkpoint-engine.js";
import { newTieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

test("TieredTouchpointCheckpointEngine keeps results within bounds", () => {
  const engine = defaultTieredTouchpointCheckpointEngine(flags.newRegistry());
  const item = newTieredTouchpointCheckpoint("code-796", "name-507");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
