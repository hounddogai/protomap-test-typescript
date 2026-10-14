import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakRecordEngine } from "./streak-record-engine.js";
import { newStreakRecord } from "./streak-record.js";

test("StreakRecordEngine keeps results within bounds", () => {
  const engine = defaultStreakRecordEngine();
  const item = newStreakRecord("code-350", "label-256");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
