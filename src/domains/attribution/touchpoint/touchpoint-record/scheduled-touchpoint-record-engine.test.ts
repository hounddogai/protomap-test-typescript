import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledTouchpointRecordEngine } from "./scheduled-touchpoint-record-engine.js";
import { newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

test("ScheduledTouchpointRecordEngine keeps results within bounds", () => {
  const engine = defaultScheduledTouchpointRecordEngine();
  const item = newScheduledTouchpointRecord("code-691", "label-393");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
