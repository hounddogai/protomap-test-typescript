import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultFrequencyRecordEngine } from "./default-frequency-record-engine.js";
import { newDefaultFrequencyRecord } from "./default-frequency-record.js";

test("DefaultFrequencyRecordEngine keeps results within bounds", () => {
  const engine = defaultDefaultFrequencyRecordEngine();
  const item = newDefaultFrequencyRecord("code-320", "label-560");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
