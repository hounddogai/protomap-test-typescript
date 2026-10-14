import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualInviteCheckpointEngine } from "./manual-invite-checkpoint-engine.js";
import { newManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

test("ManualInviteCheckpointEngine keeps results within bounds", () => {
  const engine = defaultManualInviteCheckpointEngine();
  const item = newManualInviteCheckpoint("code-722", "label-823");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
