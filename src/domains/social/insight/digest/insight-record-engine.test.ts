import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightRecordEngine } from "./insight-record-engine.js";
import { newInsightRecord } from "./insight-record.js";

test("InsightRecordEngine keeps results within bounds", () => {
  const engine = defaultInsightRecordEngine(flags.newRegistry());
  const item = newInsightRecord("code-440", "name-176");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
