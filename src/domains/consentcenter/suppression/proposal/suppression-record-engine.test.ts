import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionRecordEngine } from "./suppression-record-engine.js";
import { newSuppressionRecord } from "./suppression-record.js";

test("SuppressionRecordEngine keeps results within bounds", () => {
  const engine = defaultSuppressionRecordEngine();
  const item = newSuppressionRecord("code-929", "title-586");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
