import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingQueueRecordEngine } from "./rolling-queue-record-engine.js";
import { newRollingQueueRecord } from "./rolling-queue-record.js";

test("RollingQueueRecordEngine keeps results within bounds", () => {
  const engine = defaultRollingQueueRecordEngine(flags.newRegistry());
  const item = newRollingQueueRecord("code-706", "name-94");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
