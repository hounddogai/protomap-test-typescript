import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedQueueRecordEngine } from "./capped-queue-record-engine.js";
import { newCappedQueueRecord } from "./capped-queue-record.js";

test("CappedQueueRecordEngine keeps results within bounds", () => {
  const engine = defaultCappedQueueRecordEngine();
  const item = newCappedQueueRecord("code-419", "title-101");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
