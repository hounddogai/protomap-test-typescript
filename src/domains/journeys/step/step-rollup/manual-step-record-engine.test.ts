import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualStepRecordEngine } from "./manual-step-record-engine.js";
import { newManualStepRecord } from "./manual-step-record.js";

test("ManualStepRecordEngine keeps results within bounds", () => {
  const engine = defaultManualStepRecordEngine();
  const item = newManualStepRecord("code-159", "name-94");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
