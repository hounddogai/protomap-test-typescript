import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyRecordEngine } from "./reply-record-engine.js";
import { newReplyRecord } from "./reply-record.js";

test("ReplyRecordEngine keeps results within bounds", () => {
  const engine = defaultReplyRecordEngine();
  const item = newReplyRecord("code-201", "name-684");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
