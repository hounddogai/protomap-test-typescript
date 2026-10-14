import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRetentionCheckpointEngine } from "./global-retention-checkpoint-engine.js";
import { newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

test("GlobalRetentionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultGlobalRetentionCheckpointEngine(flags.newRegistry());
  const item = newGlobalRetentionCheckpoint("code-597", "title-155");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
