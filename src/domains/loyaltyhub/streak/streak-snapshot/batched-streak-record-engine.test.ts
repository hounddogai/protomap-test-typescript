import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedStreakRecordEngine } from "./batched-streak-record-engine.js";
import { newBatchedStreakRecord } from "./batched-streak-record.js";

test("BatchedStreakRecordEngine keeps results within bounds", () => {
  const engine = defaultBatchedStreakRecordEngine();
  const item = newBatchedStreakRecord("code-856", "title-185");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
