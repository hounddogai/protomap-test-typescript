import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleCheckpointEngine } from "./exit-rule-checkpoint-engine.js";
import { newExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

test("ExitRuleCheckpointEngine keeps results within bounds", () => {
  const engine = defaultExitRuleCheckpointEngine();
  const item = newExitRuleCheckpoint("code-637", "title-386");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
