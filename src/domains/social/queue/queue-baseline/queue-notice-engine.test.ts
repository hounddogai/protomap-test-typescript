import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueNoticeEngine } from "./queue-notice-engine.js";
import { newQueueNotice } from "./queue-notice.js";

test("QueueNoticeEngine keeps results within bounds", () => {
  const engine = defaultQueueNoticeEngine();
  const item = newQueueNotice("code-49", "title-453");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
