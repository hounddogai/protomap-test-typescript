import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionBatchEngine } from "./mention-batch-engine.js";
import { newMentionBatch } from "./mention-batch.js";

test("MentionBatchEngine keeps results within bounds", () => {
  const engine = defaultMentionBatchEngine();
  const item = newMentionBatch("code-226", "name-620");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
