import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepRecordEngine } from "./step-record-engine.js";
import { newStepRecord } from "./step-record.js";

test("StepRecordEngine keeps results within bounds", () => {
  const engine = defaultStepRecordEngine(flags.newRegistry());
  const item = newStepRecord("code-227", "name-940");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
