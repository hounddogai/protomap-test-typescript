import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingFrequencyRecordEngine } from "./rolling-frequency-record-engine.js";
import { newRollingFrequencyRecord } from "./rolling-frequency-record.js";

test("RollingFrequencyRecordEngine keeps results within bounds", () => {
  const engine = defaultRollingFrequencyRecordEngine(flags.newRegistry());
  const item = newRollingFrequencyRecord("code-456", "label-7");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
