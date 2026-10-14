import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionCheckpointEngine } from "./mention-checkpoint-engine.js";
import { newMentionCheckpoint } from "./mention-checkpoint.js";

test("MentionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultMentionCheckpointEngine();
  const item = newMentionCheckpoint("code-232", "label-493");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
