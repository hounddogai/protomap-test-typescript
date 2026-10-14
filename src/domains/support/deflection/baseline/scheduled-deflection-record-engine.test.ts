import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledDeflectionRecordEngine } from "./scheduled-deflection-record-engine.js";
import { newScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

test("ScheduledDeflectionRecordEngine keeps results within bounds", () => {
  const engine = defaultScheduledDeflectionRecordEngine(flags.newRegistry());
  const item = newScheduledDeflectionRecord("code-123", "label-323");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
