import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingExitRuleCheckpointEngine } from "./rolling-exit-rule-checkpoint-engine.js";
import { newRollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

test("RollingExitRuleCheckpointEngine keeps results within bounds", () => {
  const engine = defaultRollingExitRuleCheckpointEngine();
  const item = newRollingExitRuleCheckpoint("code-476", "name-651");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
