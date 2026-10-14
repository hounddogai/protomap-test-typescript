import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedConversionRecordEngine } from "./batched-conversion-record-engine.js";
import { newBatchedConversionRecord } from "./batched-conversion-record.js";

test("BatchedConversionRecordEngine keeps results within bounds", () => {
  const engine = defaultBatchedConversionRecordEngine();
  const item = newBatchedConversionRecord("code-763", "label-81");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
