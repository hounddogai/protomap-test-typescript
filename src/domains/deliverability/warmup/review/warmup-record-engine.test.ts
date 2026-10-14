import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupRecordEngine } from "./warmup-record-engine.js";
import { newWarmupRecord } from "./warmup-record.js";

test("WarmupRecordEngine keeps results within bounds", () => {
  const engine = defaultWarmupRecordEngine();
  const item = newWarmupRecord("code-841", "name-115");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
