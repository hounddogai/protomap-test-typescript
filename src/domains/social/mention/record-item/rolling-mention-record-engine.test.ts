import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingMentionRecordEngine } from "./rolling-mention-record-engine.js";
import { newRollingMentionRecord } from "./rolling-mention-record.js";

test("RollingMentionRecordEngine keeps results within bounds", () => {
  const engine = defaultRollingMentionRecordEngine();
  const item = newRollingMentionRecord("code-528", "name-715");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
